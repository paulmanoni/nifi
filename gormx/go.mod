module github.com/paulmanoni/nifi/gormx

go 1.26.2

require (
	github.com/paulmanoni/nifi v0.1.0
	gorm.io/gorm v1.31.0
)

require (
	filippo.io/edwards25519 v1.1.1 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/expr-lang/expr v1.17.8 // indirect
	github.com/go-sql-driver/mysql v1.8.1 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.9.2 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/kballard/go-shellquote v0.0.0-20180428030007-95032a82bc51 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	go.starlark.net v0.0.0-20260908191801-89a6a09411d5 // indirect
	golang.org/x/crypto v0.54.0 // indirect
	golang.org/x/mod v0.38.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/sys v0.48.0 // indirect
	golang.org/x/text v0.41.0 // indirect
	golang.org/x/tools v0.48.0 // indirect
	lukechampine.com/uint128 v1.2.0 // indirect
	modernc.org/cc/v3 v3.40.0 // indirect
	modernc.org/ccgo/v3 v3.16.13 // indirect
	modernc.org/libc v1.22.5 // indirect
	modernc.org/mathutil v1.6.0 // indirect
	modernc.org/memory v1.5.0 // indirect
	modernc.org/opt v0.2.0 // indirect
	modernc.org/sqlite v1.23.1 // indirect
	modernc.org/strutil v1.2.0 // indirect
	modernc.org/token v1.1.0 // indirect
)

// Build against the parent as it is in this repo, rather than the released
// version above. It applies while developing here and is ignored by anything
// that depends on this module, which resolves the require instead.
replace github.com/paulmanoni/nifi => ../
