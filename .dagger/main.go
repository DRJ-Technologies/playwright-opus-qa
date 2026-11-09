package main

import (
	"context"

	"dagger/playwright-opus-qa-ci/internal/dagger"
)

type PlaywrightOpusQaCi struct{}

// Check compiles the library using its maintained build script. The example
// browser/provider journeys are not run and no API credentials are accepted.
func (m *PlaywrightOpusQaCi) Check(ctx context.Context, source *dagger.Directory) error {
	_, err := dag.Container().
		From("node:22-bookworm-slim").
		WithDirectory("/src", source, dagger.ContainerWithDirectoryOpts{
			Exclude: []string{".git", ".dagger", "**/node_modules", "dist", "**/.env", "**/.env.*", "**/.npmrc"},
		}).
		WithWorkdir("/src").
		WithEnvVariable("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1").
		WithExec([]string{"npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"}).
		WithExec([]string{"npm", "run", "build"}).
		Sync(ctx)
	return err
}
