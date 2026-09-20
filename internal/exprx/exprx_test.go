package exprx

import "testing"

func TestExpressions(t *testing.T) {
	env := Env(nil, "users", []string{"first", "last", "email", "age", "note"}, []any{"Ada", "Lovelace", " ADA@X.IO ", int64(36), nil})
	for src, want := range map[string]any{
		`concat(first, " ", last)`:          "Ada Lovelace",
		`lower(trim(email))`:                "ada@x.io",
		`age >= 18 && table == "users"`:     true,
		`coalesce(note, "n/a")`:             "n/a",
		`regexReplace(email, "[^A-Z]", "")`: "ADAXIO",
		`snake("UserProfileID")`:            "user_profile_id",
		`row["first"]`:                      "Ada",
		`substr(last, 0, 4)`:                "Love",
		`isNull(note)`:                      true,
	} {
		p, err := Compile(src)
		if err != nil {
			t.Fatalf("%s: %v", src, err)
		}
		got, err := p.Run(env)
		if err != nil || got != want {
			t.Errorf("%s = %#v (%v), want %#v", src, got, err, want)
		}
	}
}
