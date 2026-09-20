package flow_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi/internal/flow"
)

// Every spec in the catalog carries a list of properties and a list of
// relationships, even when they are empty. A null in either is a case every
// reader of the catalog would have to guard against, and one of them always
// forgets: a node with no settings used to crash the settings panel.
func TestCatalogNeverSendsNullLists(t *testing.T) {
	raw, err := json.Marshal(flow.Specs())
	if err != nil {
		t.Fatal(err)
	}
	var specs []map[string]any
	if err := json.Unmarshal(raw, &specs); err != nil {
		t.Fatal(err)
	}
	if len(specs) == 0 {
		t.Fatal("the catalog is empty")
	}
	for _, s := range specs {
		for _, key := range []string{"properties", "relationships"} {
			v, present := s[key]
			if !present || v == nil {
				t.Errorf("%v: %s is %v; want a list", s["type"], key, v)
			}
		}
	}
	if strings.Contains(string(raw), `"properties":null`) {
		t.Error("the catalog contains a null properties list")
	}
}
