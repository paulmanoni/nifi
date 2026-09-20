package nifi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"path"
	"sort"
	"strconv"
	"time"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

// FlowRef identifies a flow to hooks.
type FlowRef struct {
	ID   string
	Name string
	// RunID is the run being prepared, so anything a hook sets up can be
	// kept against that run and dropped when it ends — rather than in a
	// process-wide place where the next run finds it. Empty outside a run.
	RunID string
}

// RunResult is what a finished run reports to Config.AfterRun.
type RunResult struct {
	RunID string
	// Status is "completed", "failed" or "stopped".
	Status      string
	StartedAt   time.Time
	FinishedAt  *time.Time
	RowsRead    int64
	RowsWritten int64
	RowsFailed  int64
	Error       string
	// Live marks a run that was following its source rather than reading it
	// once — it ended because it was stopped, not because there was no more
	// to read.
	Live bool
}

// SeedFlow is the file format of Config.SeedFlows: one flow per *.json file.
//
//	{"id": "mig_regions", "version": 2, "name": "regions", "folder": "reference",
//	 "description": "…", "dependsOn": ["mig_countries"], "graph": {…}}
//
// id must be stable (it keys runs, checkpoints and dependencies); graph is
// the same shape the API uses.
type SeedFlow struct {
	ID          string `json:"id"`
	Version     int    `json:"version"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Folder groups the flow in the list; nested with "/".
	Folder    string          `json:"folder"`
	DependsOn []string        `json:"dependsOn"`
	Graph     json.RawMessage `json:"graph"`
}

func seedFlows(ctx context.Context, st *store.Store, fsys fs.FS) error {
	files, err := fs.Glob(fsys, "*.json")
	if err != nil {
		return err
	}
	sort.Strings(files)
	var seeds []SeedFlow
	ids := map[string]bool{}
	for _, f := range files {
		raw, err := fs.ReadFile(fsys, f)
		if err != nil {
			return err
		}
		var sf SeedFlow
		if err := json.Unmarshal(raw, &sf); err != nil {
			return fmt.Errorf("nifi: seed %s: %w", f, err)
		}
		if sf.ID == "" || sf.Name == "" {
			return fmt.Errorf("nifi: seed %s: id and name are required", path.Base(f))
		}
		if ids[sf.ID] {
			return fmt.Errorf("nifi: seed %s: duplicate flow id %q", path.Base(f), sf.ID)
		}
		ids[sf.ID] = true
		seeds = append(seeds, sf)
	}
	for _, sf := range seeds {
		for _, d := range sf.DependsOn {
			if !ids[d] {
				if _, err := st.GetFlow(ctx, d); err != nil {
					return fmt.Errorf("nifi: seed %s depends on unknown flow %q", sf.ID, d)
				}
			}
		}
		g := &model.Graph{}
		if len(sf.Graph) > 0 {
			if err := json.Unmarshal(sf.Graph, g); err != nil {
				return fmt.Errorf("nifi: seed %s: graph: %w", sf.ID, err)
			}
		}
		f := model.Flow{ID: sf.ID, Name: sf.Name, Description: sf.Description, Folder: sf.Folder,
			DependsOn: sf.DependsOn, Graph: g, Actor: "seed", Note: fmt.Sprintf("seeded version %d", sf.Version)}
		key := "seed_version:" + sf.ID
		applied, _ := st.GetKV(ctx, "", key)
		have, _ := strconv.Atoi(applied)
		_, getErr := st.GetFlow(ctx, sf.ID)
		switch {
		case errors.Is(getErr, store.ErrNotFound):
			if _, err := st.CreateFlowWithID(ctx, f); err != nil {
				return fmt.Errorf("nifi: seed %s: %w", sf.ID, err)
			}
		case getErr != nil:
			return getErr
		case sf.Version > have:
			// Keep the stored flow's edit count so its history stays in order.
			if cur, err := st.GetFlow(ctx, sf.ID); err == nil {
				f.Version = cur.Version
			}
			if _, err := st.SaveFlow(ctx, f); err != nil {
				return fmt.Errorf("nifi: seed %s: %w", sf.ID, err)
			}
		default:
			continue
		}
		if err := st.SetKV(ctx, "", key, strconv.Itoa(sf.Version)); err != nil {
			return err
		}
	}
	return nil
}
