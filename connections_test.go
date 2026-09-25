package nifi_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi"
)

// A connection can be added through the API and used by a flow, while the ones
// the host declared in code stay its own: they cannot be changed or deleted
// here, and a stored one can never take over an id the application owns.
func TestConnectionsAddedThroughTheAPI(t *testing.T) {
	e, err := nifi.New(nifi.Config{
		DataPath:    filepath.Join(t.TempDir(), "n.db"),
		Connections: []nifi.Connection{{ID: "declared", Driver: "postgres", Host: "h", Database: "d"}},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(t.Context())
	h := e.Handler()

	call := func(method, path, body string) (int, string) {
		var rd *strings.Reader = strings.NewReader(body)
		req := httptest.NewRequest(method, path, rd)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code, rec.Body.String()
	}

	// added here
	if code, b := call("PUT", "/api/connections/warehouse",
		`{"driver":"postgres","host":"localhost","port":5432,"user":"app","password":"s3cret","database":"wh"}`); code != 200 {
		t.Fatalf("save: %d %s", code, b)
	}

	code, body := call("GET", "/api/connections", "")
	if code != 200 {
		t.Fatalf("list: %d %s", code, body)
	}
	if strings.Contains(body, "s3cret") {
		t.Fatal("the password came back out of the API")
	}
	var list []struct {
		ID      string `json:"id"`
		Managed bool   `json:"managed"`
	}
	json.Unmarshal([]byte(body), &list)
	got := map[string]bool{}
	for _, c := range list {
		got[c.ID] = c.Managed
	}
	if len(list) != 2 || got["warehouse"] != true || got["declared"] != false {
		t.Fatalf("listed %v; want the declared one unmanaged and the added one managed", got)
	}

	// what the application declared is not this API's to change
	if code, _ := call("PUT", "/api/connections/declared", `{"driver":"mysql","host":"x","database":"y"}`); code != http.StatusConflict {
		t.Errorf("overwriting a declared connection returned %d; want 409", code)
	}
	if code, _ := call("DELETE", "/api/connections/declared", ""); code != http.StatusConflict {
		t.Errorf("deleting a declared connection returned %d; want 409", code)
	}

	// an edit that does not mention the password keeps the one stored
	if code, b := call("PUT", "/api/connections/warehouse",
		`{"driver":"postgres","host":"elsewhere","port":5432,"user":"app","database":"wh"}`); code != 200 {
		t.Fatalf("edit: %d %s", code, b)
	}
	if code, _ := call("DELETE", "/api/connections/warehouse", ""); code != 200 {
		t.Errorf("delete returned %d", code)
	}
	code, body = call("GET", "/api/connections", "")
	if strings.Contains(body, "warehouse") {
		t.Fatalf("still listed after delete: %s", body)
	}
}
