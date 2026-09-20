package dbx

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"

	"github.com/paulmanoni/nifi/record"
)

type mysqlDB struct {
	db     *sql.DB
	schema string
	loc    *time.Location
}

func (m *mysqlDB) Location() *time.Location { return m.loc }

func openMySQL(ctx context.Context, c Connection) (DB, error) {
	cfg := mysql.NewConfig()
	cfg.User = c.User
	cfg.Passwd = c.Password
	cfg.Net = "tcp"
	cfg.Addr = fmt.Sprintf("%s:%d", c.Host, c.port(3306))
	cfg.DBName = c.Database
	// Text protocol everywhere: raw values are parsed by our converter, which
	// sees zero dates and odd encodings before a driver can reject them.
	cfg.InterpolateParams = true
	cfg.ParseTime = false
	loc, err := c.Location()
	if err != nil {
		return nil, fmt.Errorf("timezone: %w", err)
	}
	cfg.Loc = loc
	// TIMESTAMP values are returned in the session zone: make it the same
	// zone DATETIME values are read in, so both parse consistently.
	_, off := time.Now().In(loc).Zone()
	sign := '+'
	if off < 0 {
		sign, off = '-', -off
	}
	cfg.Params = map[string]string{"time_zone": fmt.Sprintf("'%c%02d:%02d'", sign, off/3600, off%3600/60)}
	cfg.MaxAllowedPacket = 0
	for k, v := range c.Params {
		switch k {
		case "tls":
			cfg.TLSConfig = v
		case "charset":
			cfg.Params["charset"] = v
		case "timezone":
		default:
			cfg.Params[k] = v
		}
	}
	if _, ok := cfg.Params["charset"]; !ok {
		cfg.Params["charset"] = "utf8mb4"
	}
	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		return nil, err
	}
	maxConns := 64
	if c.MaxConns > 0 {
		maxConns = c.MaxConns
	}
	db.SetMaxOpenConns(maxConns)
	db.SetMaxIdleConns(16)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return &mysqlDB{db: db, schema: c.Database, loc: loc}, nil
}

func (m *mysqlDB) Driver() string { return "mysql" }
func (m *mysqlDB) Close()         { m.db.Close() }

func (m *mysqlDB) Quote(s string) string { return "`" + strings.ReplaceAll(s, "`", "``") + "`" }

func (m *mysqlDB) QualifiedName(t *record.TableMeta) string {
	if t.Schema != "" && t.Schema != m.schema {
		return m.Quote(t.Schema) + "." + m.Quote(t.Name)
	}
	return m.Quote(t.Name)
}

func (m *mysqlDB) Version(ctx context.Context) (string, error) {
	var v string
	err := m.db.QueryRowContext(ctx, "SELECT VERSION()").Scan(&v)
	return v, err
}

func (m *mysqlDB) ListTables(ctx context.Context) ([]TableSummary, error) {
	rows, err := m.db.QueryContext(ctx, `
		SELECT t.TABLE_NAME, COALESCE(t.TABLE_ROWS,0), COALESCE(t.DATA_LENGTH,0)+COALESCE(t.INDEX_LENGTH,0),
		       EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS c
		              WHERE c.TABLE_SCHEMA=t.TABLE_SCHEMA AND c.TABLE_NAME=t.TABLE_NAME AND c.CONSTRAINT_TYPE='PRIMARY KEY')
		FROM information_schema.TABLES t
		WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
		ORDER BY t.TABLE_NAME`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TableSummary
	for rows.Next() {
		var s TableSummary
		var pk int
		if err := rows.Scan(&s.Name, &s.EstimatedRows, &s.SizeBytes, &pk); err != nil {
			return nil, err
		}
		s.Schema = m.schema
		s.HasPrimaryKey = pk == 1
		out = append(out, s)
	}
	return out, rows.Err()
}

func (m *mysqlDB) Describe(ctx context.Context, table string) (*record.TableMeta, error) {
	schema, name := SplitTable(table)
	if schema == "" {
		schema = m.schema
	}
	t := &record.TableMeta{Dialect: "mysql", Schema: schema, Name: name}

	rows, err := m.db.QueryContext(ctx, `
		SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH,
		       NUMERIC_PRECISION, NUMERIC_SCALE, COLUMN_DEFAULT, EXTRA
		FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION`, schema, name)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var (
			colName, dataType, colType, nullable string
			length, prec, scale                  sql.NullInt64
			def                                  sql.NullString
			extra                                string
		)
		if err := rows.Scan(&colName, &dataType, &colType, &nullable, &length, &prec, &scale, &def, &extra); err != nil {
			rows.Close()
			return nil, err
		}
		c := mysqlColumn(colName, strings.ToLower(dataType), strings.ToLower(colType), length.Int64, int(prec.Int64), int(scale.Int64))
		c.Nullable = nullable == "YES"
		c.AutoIncrement = strings.Contains(strings.ToLower(extra), "auto_increment")
		c.Generated = strings.Contains(strings.ToLower(extra), " generated") && !strings.Contains(strings.ToLower(extra), "default_generated")
		if def.Valid {
			c.Default = mysqlDefault(def.String, c.Type, strings.Contains(strings.ToLower(extra), "default_generated"))
		}
		t.Columns = append(t.Columns, c)
	}
	rows.Close()
	if len(t.Columns) == 0 {
		return nil, fmt.Errorf("table %q not found", table)
	}

	rows, err = m.db.QueryContext(ctx, `
		SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME FROM information_schema.STATISTICS
		WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME IS NOT NULL
		ORDER BY INDEX_NAME, SEQ_IN_INDEX`, schema, name)
	if err != nil {
		return nil, err
	}
	idx := map[string]*record.Index{}
	var order []string
	for rows.Next() {
		var in, col string
		var nonUnique int
		if err := rows.Scan(&in, &nonUnique, &col); err != nil {
			rows.Close()
			return nil, err
		}
		if in == "PRIMARY" {
			t.PrimaryKey = append(t.PrimaryKey, col)
			continue
		}
		ix, ok := idx[in]
		if !ok {
			ix = &record.Index{Name: in, Unique: nonUnique == 0}
			idx[in] = ix
			order = append(order, in)
		}
		ix.Columns = append(ix.Columns, col)
	}
	rows.Close()
	for _, n := range order {
		t.Indexes = append(t.Indexes, *idx[n])
	}

	rows, err = m.db.QueryContext(ctx, `
		SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE, r.UPDATE_RULE
		FROM information_schema.KEY_COLUMN_USAGE k
		JOIN information_schema.REFERENTIAL_CONSTRAINTS r
		  ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME
		WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY k.CONSTRAINT_NAME, k.ORDINAL_POSITION`, schema, name)
	if err != nil {
		return nil, err
	}
	fks := map[string]*record.ForeignKey{}
	order = order[:0]
	for rows.Next() {
		var cn, col, rt, rc, del, upd string
		if err := rows.Scan(&cn, &col, &rt, &rc, &del, &upd); err != nil {
			rows.Close()
			return nil, err
		}
		fk, ok := fks[cn]
		if !ok {
			fk = &record.ForeignKey{Name: cn, RefTable: rt, OnDelete: del, OnUpdate: upd}
			fks[cn] = fk
			order = append(order, cn)
		}
		fk.Columns = append(fk.Columns, col)
		fk.RefColumns = append(fk.RefColumns, rc)
	}
	rows.Close()
	for _, n := range order {
		t.ForeignKeys = append(t.ForeignKeys, *fks[n])
	}

	var est sql.NullInt64
	_ = m.db.QueryRowContext(ctx, `SELECT TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`, schema, name).Scan(&est)
	t.EstimatedRows = est.Int64
	return t, nil
}

func mysqlColumn(name, dataType, colType string, length int64, prec, scale int) record.Column {
	c := record.Column{Name: name, NativeType: colType, Length: length, Precision: prec, Scale: scale}
	unsigned := strings.Contains(colType, "unsigned")
	switch dataType {
	case "tinyint":
		if strings.HasPrefix(colType, "tinyint(1)") && !unsigned {
			c.Type = record.Bool
		} else {
			c.Type = record.Int16
		}
	case "smallint":
		c.Type = pick(unsigned, record.Int32, record.Int16)
	case "mediumint":
		c.Type = record.Int32
	case "int", "integer":
		c.Type = pick(unsigned, record.Int64, record.Int32)
	case "bigint":
		c.Type = pick(unsigned, record.Uint64, record.Int64)
	case "decimal", "numeric":
		c.Type = record.Decimal
	case "float":
		c.Type = record.Float32
	case "double", "real":
		c.Type = record.Float64
	case "bit":
		if colType == "bit(1)" {
			c.Type = record.Bool
		} else {
			c.Type = record.Bit
			c.Length = int64(prec)
		}
	case "char", "varchar":
		c.Type = record.String
	case "tinytext", "text", "mediumtext", "longtext":
		c.Type = record.Text
		c.Length = 0
	case "binary", "varbinary", "tinyblob", "blob", "mediumblob", "longblob":
		c.Type = record.Bytes
	case "date":
		c.Type = record.Date
	case "datetime":
		c.Type = record.Timestamp
	case "timestamp":
		c.Type = record.TimestampTZ
	case "time":
		c.Type = record.Time
	case "year":
		c.Type = record.Year
	case "json":
		c.Type = record.JSON
	case "enum", "set":
		c.Type = pick(dataType == "enum", record.Enum, record.Set)
		c.Values = parseMySQLValues(colType)
	case "geometry", "point", "linestring", "polygon", "multipoint", "multilinestring", "multipolygon", "geometrycollection":
		c.Type = record.Bytes
	default:
		c.Type = record.Other
	}
	return c
}

func pick[T any](cond bool, a, b T) T {
	if cond {
		return a
	}
	return b
}

func parseMySQLValues(colType string) []string {
	open, close := strings.IndexByte(colType, '('), strings.LastIndexByte(colType, ')')
	if open < 0 || close <= open {
		return nil
	}
	var out []string
	body := colType[open+1 : close]
	for len(body) > 0 {
		if body[0] != '\'' {
			body = body[1:]
			continue
		}
		var b strings.Builder
		i := 1
		for i < len(body) {
			if body[i] == '\'' {
				if i+1 < len(body) && body[i+1] == '\'' {
					b.WriteByte('\'')
					i += 2
					continue
				}
				break
			}
			b.WriteByte(body[i])
			i++
		}
		out = append(out, b.String())
		body = body[min(i+1, len(body)):]
	}
	return out
}

// mysqlDefault translates a MySQL column default into a portable SQL literal
// or expression, returning "" when it cannot be carried over safely.
func mysqlDefault(def string, t record.Type, generated bool) string {
	upper := strings.ToUpper(def)
	if strings.HasPrefix(upper, "CURRENT_TIMESTAMP") || upper == "NOW()" {
		return "CURRENT_TIMESTAMP"
	}
	if generated || strings.EqualFold(def, "NULL") {
		return ""
	}
	switch t {
	case record.Bool:
		if def == "1" || def == "b'1'" {
			return "true"
		}
		return "false"
	case record.Int16, record.Int32, record.Int64, record.Uint64, record.Float32, record.Float64, record.Decimal, record.Year:
		if _, err := strconv.ParseFloat(def, 64); err == nil {
			return def
		}
		return ""
	case record.Date, record.Timestamp, record.TimestampTZ:
		if strings.HasPrefix(def, "0000-00-00") {
			return ""
		}
	case record.Bytes, record.Bit, record.JSON, record.Other:
		return ""
	}
	return "'" + strings.ReplaceAll(def, "'", "''") + "'"
}

func (m *mysqlDB) MinMax(ctx context.Context, t *record.TableMeta, col string) (int64, int64, bool, error) {
	var lo, hi sql.NullString
	q := fmt.Sprintf("SELECT MIN(%s), MAX(%s) FROM %s", m.Quote(col), m.Quote(col), m.QualifiedName(t))
	if err := m.db.QueryRowContext(ctx, q).Scan(&lo, &hi); err != nil {
		return 0, 0, false, err
	}
	if !lo.Valid || !hi.Valid {
		return 0, 0, false, nil
	}
	l, err1 := strconv.ParseInt(lo.String, 10, 64)
	h, err2 := strconv.ParseInt(hi.String, 10, 64)
	if err1 != nil || err2 != nil {
		return 0, 0, false, fmt.Errorf("non-integer key bounds %q..%q", lo.String, hi.String)
	}
	return l, h, true, nil
}

func (m *mysqlDB) Scan(ctx context.Context, query string, args []any, fn func([][]byte) error) error {
	rows, err := m.db.QueryContext(ctx, query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	cols, err := rows.Columns()
	if err != nil {
		return err
	}
	raw := make([]sql.RawBytes, len(cols))
	dest := make([]any, len(cols))
	for i := range raw {
		dest[i] = &raw[i]
	}
	out := make([][]byte, len(cols))
	for rows.Next() {
		if err := rows.Scan(dest...); err != nil {
			return err
		}
		for i, r := range raw {
			if r == nil {
				out[i] = nil
			} else {
				out[i] = r
			}
		}
		if err := fn(out); err != nil {
			return err
		}
	}
	return rows.Err()
}

func (m *mysqlDB) QueryColumns(ctx context.Context, query string) ([]record.Column, error) {
	rows, err := m.db.QueryContext(ctx, "SELECT * FROM ("+query+") nifi_q LIMIT 0")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cts, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}
	out := make([]record.Column, len(cts))
	for i, ct := range cts {
		dt := strings.ToLower(ct.DatabaseTypeName())
		colType := dt
		unsigned := strings.HasPrefix(dt, "unsigned ")
		dt = strings.TrimPrefix(dt, "unsigned ")
		if unsigned {
			colType = dt + " unsigned"
		}
		length, _ := ct.Length()
		prec, scale, _ := ct.DecimalSize()
		c := mysqlColumn(ct.Name(), dt, colType, length, int(prec), int(scale))
		c.Nullable, _ = ct.Nullable()
		out[i] = c
	}
	return out, nil
}
