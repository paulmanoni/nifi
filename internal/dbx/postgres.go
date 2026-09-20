package dbx

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/paulmanoni/nifi/record"
)

// PG is an open PostgreSQL database. It is both a source and the bulk writer
// target, so the pool is exported to the writer in this package.
type PG struct {
	Pool *pgxpool.Pool
}

func openPostgres(ctx context.Context, c Connection) (DB, error) {
	n := int32(32)
	if c.MaxConns > 0 {
		n = int32(c.MaxConns)
	}
	return OpenPG(ctx, c, n)
}

// OpenPG opens a pool with maxConns connections and a UTC, ISO-datestyle
// session so text-protocol values parse deterministically.
func OpenPG(ctx context.Context, c Connection, maxConns int32) (*PG, error) {
	cfg, err := pgxpool.ParseConfig(c.Expanded().postgresURL())
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = maxConns
	cfg.ConnConfig.RuntimeParams["timezone"] = "UTC"
	cfg.ConnConfig.RuntimeParams["datestyle"] = "ISO, YMD"
	cfg.ConnConfig.RuntimeParams["intervalstyle"] = "postgres"
	cfg.ConnConfig.RuntimeParams["extra_float_digits"] = "3"
	cfg.ConnConfig.RuntimeParams["bytea_output"] = "hex"
	cfg.ConnConfig.RuntimeParams["application_name"] = "nifi"
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &PG{Pool: pool}, nil
}

func (p *PG) Driver() string { return "postgres" }

// Location: PostgreSQL sessions run in UTC; naive timestamps are read as UTC.
func (p *PG) Location() *time.Location { return time.UTC }
func (p *PG) Close()                   { p.Pool.Close() }

// Quote quotes a PostgreSQL identifier.
func (p *PG) Quote(s string) string { return QuotePG(s) }

// QuotePG quotes a PostgreSQL identifier.
func QuotePG(s string) string { return `"` + strings.ReplaceAll(s, `"`, `""`) + `"` }

func (p *PG) QualifiedName(t *record.TableMeta) string {
	if t.Schema == "" {
		return QuotePG(t.Name)
	}
	return QuotePG(t.Schema) + "." + QuotePG(t.Name)
}

func (p *PG) Version(ctx context.Context) (string, error) {
	var v string
	err := p.Pool.QueryRow(ctx, "SHOW server_version").Scan(&v)
	return v, err
}

func (p *PG) ListTables(ctx context.Context) ([]TableSummary, error) {
	rows, err := p.Pool.Query(ctx, `
		SELECT n.nspname, c.relname, GREATEST(c.reltuples,0)::bigint, pg_total_relation_size(c.oid),
		       EXISTS(SELECT 1 FROM pg_index i WHERE i.indrelid=c.oid AND i.indisprimary)
		FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
		WHERE c.relkind IN ('r','p') AND NOT c.relispartition
		  AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg\_%'
		ORDER BY n.nspname, c.relname`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TableSummary
	for rows.Next() {
		var s TableSummary
		if err := rows.Scan(&s.Schema, &s.Name, &s.EstimatedRows, &s.SizeBytes, &s.HasPrimaryKey); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// TableName renders the display name used across the app: bare for the public
// schema, schema-qualified otherwise.
func TableName(schema, name string) string {
	if schema == "" || schema == "public" {
		return name
	}
	return schema + "." + name
}

func (p *PG) Describe(ctx context.Context, table string) (*record.TableMeta, error) {
	schema, name := SplitTable(table)
	if schema == "" {
		schema = "public"
	}
	t := &record.TableMeta{Dialect: "postgres", Schema: schema, Name: name}
	reg := QuotePG(schema) + "." + QuotePG(name)

	rows, err := p.Pool.Query(ctx, `
		SELECT a.attname, format_type(a.atttypid, a.atttypmod), t.typname, t.typtype::text, t.typcategory::text,
		       tn.nspname, NOT a.attnotnull, COALESCE(pg_get_expr(d.adbin, d.adrelid),''), a.attidentity::text,
		       a.attgenerated::text,
		       CASE WHEN a.atttypmod > 0 THEN a.atttypmod ELSE -1 END,
		       COALESCE(information_schema._pg_numeric_precision(a.atttypid, a.atttypmod),0),
		       COALESCE(information_schema._pg_numeric_scale(a.atttypid, a.atttypmod),0),
		       COALESCE(information_schema._pg_char_max_length(a.atttypid, a.atttypmod),0),
		       COALESCE((SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid), '{}')
		FROM pg_attribute a
		JOIN pg_type t ON t.oid=a.atttypid
		JOIN pg_namespace tn ON tn.oid=t.typnamespace
		LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
		WHERE a.attrelid=$1::regclass AND a.attnum>0 AND NOT a.attisdropped
		ORDER BY a.attnum`, reg)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var (
			c                                       record.Column
			format, typname, typtype, typcat, typNS string
			def, identity, generated                string
			typmod                                  int32
			prec, scale, length                     int32
			enumVals                                []string
		)
		if err := rows.Scan(&c.Name, &format, &typname, &typtype, &typcat, &typNS, &c.Nullable, &def, &identity,
			&generated, &typmod, &prec, &scale, &length, &enumVals); err != nil {
			rows.Close()
			return nil, err
		}
		c.NativeType = format
		c.Precision, c.Scale, c.Length = int(prec), int(scale), int64(length)
		c.Type = pgLogical(typname, typtype, typcat)
		if typNS != "pg_catalog" && c.Type != record.Enum {
			c.Type = record.Other
		}
		if c.Type == record.Enum {
			c.Values = enumVals
		}
		c.Generated = generated != ""
		if identity != "" || strings.HasPrefix(def, "nextval(") {
			c.AutoIncrement = true
		} else if generated == "" && def != "" {
			c.Default = def
		}
		t.Columns = append(t.Columns, c)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(t.Columns) == 0 {
		return nil, fmt.Errorf("table %q not found", table)
	}

	err = p.Pool.QueryRow(ctx, `
		SELECT COALESCE(array_agg(a.attname ORDER BY k.ord), '{}')
		FROM pg_index i
		CROSS JOIN LATERAL unnest(i.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
		JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum
		WHERE i.indrelid=$1::regclass AND i.indisprimary`, reg).Scan(&t.PrimaryKey)
	if err != nil {
		return nil, err
	}

	rows, err = p.Pool.Query(ctx, `
		SELECT ic.relname, i.indisunique,
		       array_agg(COALESCE(a.attname,'') ORDER BY k.ord) FILTER (WHERE k.ord <= i.indnkeyatts),
		       bool_or(k.attnum = 0) OR i.indpred IS NOT NULL
		FROM pg_index i
		JOIN pg_class ic ON ic.oid=i.indexrelid
		CROSS JOIN LATERAL unnest(i.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
		LEFT JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum
		WHERE i.indrelid=$1::regclass AND NOT i.indisprimary
		GROUP BY ic.relname, i.indisunique, i.indpred
		ORDER BY ic.relname`, reg)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var ix record.Index
		var expr bool
		if err := rows.Scan(&ix.Name, &ix.Unique, &ix.Columns, &expr); err != nil {
			rows.Close()
			return nil, err
		}
		if !expr {
			t.Indexes = append(t.Indexes, ix)
		}
	}
	rows.Close()

	rows, err = p.Pool.Query(ctx, `
		SELECT con.conname,
		       (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(con.conkey) WITH ORDINALITY k(n,ord)
		          JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=k.n),
		       rn.nspname, rc.relname,
		       (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(con.confkey) WITH ORDINALITY k(n,ord)
		          JOIN pg_attribute a ON a.attrelid=con.confrelid AND a.attnum=k.n),
		       con.confdeltype::text, con.confupdtype::text
		FROM pg_constraint con
		JOIN pg_class rc ON rc.oid=con.confrelid
		JOIN pg_namespace rn ON rn.oid=rc.relnamespace
		WHERE con.conrelid=$1::regclass AND con.contype='f'
		ORDER BY con.conname`, reg)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var fk record.ForeignKey
		var rs, rt, del, upd string
		if err := rows.Scan(&fk.Name, &fk.Columns, &rs, &rt, &fk.RefColumns, &del, &upd); err != nil {
			rows.Close()
			return nil, err
		}
		fk.RefTable = TableName(rs, rt)
		fk.OnDelete, fk.OnUpdate = pgFKAction(del), pgFKAction(upd)
		t.ForeignKeys = append(t.ForeignKeys, fk)
	}
	rows.Close()

	var est float64
	_ = p.Pool.QueryRow(ctx, `SELECT reltuples FROM pg_class WHERE oid=$1::regclass`, reg).Scan(&est)
	if est > 0 {
		t.EstimatedRows = int64(est)
	}
	return t, nil
}

func pgFKAction(c string) string {
	switch c {
	case "c":
		return "CASCADE"
	case "n":
		return "SET NULL"
	case "d":
		return "SET DEFAULT"
	case "r":
		return "RESTRICT"
	default:
		return "NO ACTION"
	}
}

func pgLogical(typname, typtype, typcat string) record.Type {
	if typtype == "e" {
		return record.Enum
	}
	if typcat == "A" {
		return record.Array
	}
	switch typname {
	case "bool":
		return record.Bool
	case "int2":
		return record.Int16
	case "int4":
		return record.Int32
	case "int8":
		return record.Int64
	case "float4":
		return record.Float32
	case "float8":
		return record.Float64
	case "numeric", "money":
		return record.Decimal
	case "varchar", "bpchar", "char":
		return record.String
	case "text", "citext", "name":
		return record.Text
	case "bytea":
		return record.Bytes
	case "date":
		return record.Date
	case "time", "timetz":
		return record.Time
	case "timestamp":
		return record.Timestamp
	case "timestamptz":
		return record.TimestampTZ
	case "interval":
		return record.Interval
	case "json", "jsonb":
		return record.JSON
	case "uuid":
		return record.UUID
	case "bit", "varbit":
		return record.Bit
	default:
		return record.Other
	}
}

func (p *PG) MinMax(ctx context.Context, t *record.TableMeta, col string) (int64, int64, bool, error) {
	var lo, hi *string
	q := fmt.Sprintf("SELECT MIN(%s)::text, MAX(%s)::text FROM %s", QuotePG(col), QuotePG(col), p.QualifiedName(t))
	if err := p.Pool.QueryRow(ctx, q).Scan(&lo, &hi); err != nil {
		return 0, 0, false, err
	}
	if lo == nil || hi == nil {
		return 0, 0, false, nil
	}
	l, err1 := strconv.ParseInt(*lo, 10, 64)
	h, err2 := strconv.ParseInt(*hi, 10, 64)
	if err1 != nil || err2 != nil {
		return 0, 0, false, fmt.Errorf("non-integer key bounds %q..%q", *lo, *hi)
	}
	return l, h, true, nil
}

func (p *PG) Scan(ctx context.Context, query string, args []any, fn func([][]byte) error) error {
	qargs := append([]any{pgx.QueryResultFormats{pgx.TextFormatCode}}, args...)
	rows, err := p.Pool.Query(ctx, query, qargs...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		if err := fn(rows.RawValues()); err != nil {
			return err
		}
	}
	return rows.Err()
}

func (p *PG) QueryColumns(ctx context.Context, query string) ([]record.Column, error) {
	conn, err := p.Pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()
	rows, err := conn.Query(ctx, "SELECT * FROM ("+query+") nifi_q LIMIT 0")
	if err != nil {
		return nil, err
	}
	fds := rows.FieldDescriptions()
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	out := make([]record.Column, len(fds))
	for i, fd := range fds {
		var typname, format, typtype, typcat string
		if err := conn.QueryRow(ctx, `SELECT t.typname, format_type(t.oid, $2), t.typtype::text, t.typcategory::text FROM pg_type t WHERE t.oid=$1`,
			fd.DataTypeOID, fd.TypeModifier).Scan(&typname, &format, &typtype, &typcat); err != nil {
			return nil, err
		}
		out[i] = record.Column{Name: fd.Name, Type: pgLogical(typname, typtype, typcat), NativeType: format, Nullable: true}
	}
	return out, nil
}
