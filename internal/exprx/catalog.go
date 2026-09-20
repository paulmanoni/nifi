package exprx

// builtins documents the functions every expression can call: expr-lang's
// own, the engine's helpers and the Go-compatible coercions. Order is the
// order the editor lists them in.
var builtins = []Function{
	{Group: "text", Name: "trim", Args: "value[, chars]", Help: "Removes surrounding whitespace (or the given characters)."},
	{Group: "text", Name: "lower", Args: "value", Help: "Lowercases the text."},
	{Group: "text", Name: "upper", Args: "value", Help: "Uppercases the text."},
	{Group: "text", Name: "concat", Args: "a, b, …", Help: "Joins the values into one string, skipping NULLs."},
	{Group: "text", Name: "substr", Args: "value, start[, length]", Help: "Part of the text; a negative start counts from the end."},
	{Group: "text", Name: "split", Args: "value, separator", Help: "Splits the text into a list."},
	{Group: "text", Name: "join", Args: "list, separator", Help: "Joins a list into text."},
	{Group: "text", Name: "replace", Args: "value, old, new", Help: "Replaces every occurrence."},
	{Group: "text", Name: "regexMatch", Args: "value, pattern", Help: "True when the pattern matches."},
	{Group: "text", Name: "regexReplace", Args: "value, pattern, replacement", Help: "Replaces every match ($1 for groups)."},
	{Group: "text", Name: "snake", Args: "value", Help: "CamelCase or spaced text as snake_case."},
	{Group: "text", Name: "str", Args: "value", Help: "The value as text (NULL stays NULL)."},
	{Group: "text", Name: "len", Args: "value", Help: "Length of text or a list."},
	{Group: "text", Name: "startsWith", Args: "value, prefix", Help: "True when the text starts with the prefix."},
	{Group: "text", Name: "endsWith", Args: "value, suffix", Help: "True when the text ends with the suffix."},

	{Group: "value", Name: "coalesce", Args: "a, b, …", Help: "The first value that is not NULL or empty."},
	{Group: "value", Name: "nullif", Args: "value, match", Help: "NULL when the value equals match, else the value."},
	{Group: "value", Name: "isNull", Args: "value", Help: "True when the value is NULL."},
	{Group: "value", Name: "isBlank", Args: "value", Help: "True when the value is NULL, empty or only spaces."},
	{Group: "value", Name: "get", Args: "map, key", Help: "A value from a map, NULL when absent — pair with ?? for a default."},
	{Group: "value", Name: "int", Args: "value", Help: "The value as a whole number."},
	{Group: "value", Name: "float", Args: "value", Help: "The value as a decimal number."},
	{Group: "value", Name: "string", Args: "value", Help: "The value as text."},
	{Group: "value", Name: "abs", Args: "number", Help: "Absolute value."},
	{Group: "value", Name: "round", Args: "number", Help: "Rounds to the nearest whole number."},
	{Group: "value", Name: "floor", Args: "number", Help: "Rounds down."},
	{Group: "value", Name: "ceil", Args: "number", Help: "Rounds up."},
	{Group: "value", Name: "max", Args: "a, b, …", Help: "The largest value."},
	{Group: "value", Name: "min", Args: "a, b, …", Help: "The smallest value."},

	{Group: "time", Name: "now", Args: "", Help: "The current time."},
	{Group: "time", Name: "parseTime", Args: "value[, layout]", Help: "Reads a timestamp from text (layout like YYYY-MM-DD HH:mm:ss)."},
	{Group: "time", Name: "formatTime", Args: "time, layout", Help: "Formats a timestamp (layout like YYYY-MM-DD)."},
	{Group: "time", Name: "date", Args: "value", Help: "Parses a date/time value."},
	{Group: "time", Name: "duration", Args: "value", Help: "A duration such as \"24h\", for adding to a time."},

	{Group: "hash", Name: "md5", Args: "value", Help: "MD5 hash as hex."},
	{Group: "hash", Name: "sha256", Args: "value", Help: "SHA-256 hash as hex."},
	{Group: "hash", Name: "uuid", Args: "", Help: "A new random UUID."},

	{Group: "go", Name: "String", Args: "value", Help: "Go String(): NULL becomes \"\", NUL bytes are stripped."},
	{Group: "go", Name: "Int", Args: "value", Help: "Go Int(): unparseable or NULL becomes 0."},
	{Group: "go", Name: "Int64", Args: "value", Help: "Go Int64()."},
	{Group: "go", Name: "Uint", Args: "value", Help: "Go Uint(): negatives become 0."},
	{Group: "go", Name: "Float64", Args: "value", Help: "Go Float64()."},
	{Group: "go", Name: "Bool", Args: "value", Help: "Go Bool(): 1/true/t/y/yes are true."},
	{Group: "go", Name: "Bytes", Args: "value", Help: "The text as raw bytes (bytea)."},
	{Group: "go", Name: "Time", Args: "value", Help: "Go Time(): NULL or a zero date becomes 0001-01-01."},
	{Group: "go", Name: "TimePtr", Args: "value", Help: "Go TimePtr(): a zero date becomes NULL."},
	{Group: "go", Name: "YearPtr", Args: "value", Help: "The year, NULL when not positive."},
	{Group: "go", Name: "OrNow", Args: "value", Help: "The current time when the value is NULL or a zero date (GORM's CreatedAt rule)."},
	{Group: "go", Name: "NilIfZero", Args: "value", Help: "NULL when the value is 0, \"\", false or a zero date."},
	{Group: "go", Name: "Upper", Args: "value", Help: "Uppercase, keeping NULL as NULL."},
	{Group: "go", Name: "PtrString", Args: "value", Help: "Text, keeping NULL as NULL."},
	{Group: "go", Name: "PtrStringNil", Args: "value", Help: "Text, with blank becoming NULL."},
	{Group: "go", Name: "PtrInt", Args: "value", Help: "Whole number, keeping NULL as NULL."},
	{Group: "go", Name: "PtrInt64", Args: "value", Help: "Whole number, keeping NULL as NULL."},
	{Group: "go", Name: "PtrUint", Args: "value", Help: "Unsigned number, keeping NULL as NULL."},
	{Group: "go", Name: "PtrFloat64", Args: "value", Help: "Decimal number, keeping NULL as NULL."},
	{Group: "go", Name: "PtrBool", Args: "value", Help: "True/false, keeping NULL as NULL."},
}

var builtinNames = func() map[string]bool {
	m := map[string]bool{}
	for _, f := range builtins {
		m[f.Name] = true
	}
	return m
}()
