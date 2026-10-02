# nifi — developer tasks.
#
#   make ui     regenerate the UI: templ code, the Tailwind stylesheet and the
#               canvas island bundle (all committed, so a plain go build needs
#               neither templ, Tailwind nor Node)
#   make test   go test across the module

TEMPL ?= go run github.com/a-h/templ/cmd/templ@v0.3.1020
TAILWIND ?= tailwindcss

.PHONY: ui templ css islands test

ui: templ css islands

templ:
	$(TEMPL) generate -path internal/web

css:
	$(TAILWIND) -i internal/web/styles.css -o internal/web/assets/nifi.css --minify

islands:
	cd ui && npm run build

test:
	go test ./...
