# AGENTS.md - Guidelines for Agentic Coding on This Repository

This is a Hugo static site project. Agents working here should understand this is a content-focused website using Hugo, not a traditional application codebase.

## Project Overview

- **Type**: Hugo Static Site Generator
- **Content**: Blog posts in Markdown with front matter
- **Theme**: Custom theme in `themes/eric-style/`
- **Output**: Generated static HTML in `public/`

---

## Build Commands

### Development Server
```bash
hugo server -D    # Start dev server with draft content
hugo server      # Start dev server, exclude drafts
```

### Production Build
```bash
hugo             # Build for production (outputs to public/)
hugo --minify    # Minify HTML output
```

### Single Test/Preview
Hugo doesn't have traditional unit tests, but you can:
```bash
hugo -v          # Verbose output for debugging
hugo --renderToMemory  # Render to memory without writing to disk
```

### Content Validation
```bash
hugo --gc        # Run garbage collection after build
hugo --check     # Check for content issues
```

---

## Code Style Guidelines

### Front Matter Format
Use YAML front matter with these required fields:
```yaml
---
title: "Post Title"
date: YYYY-MM-DD
draft: true/false
author: Your Name
tags: [Tag1, Tag2]
---
```

- **date**: ISO format (2024-07-10)
- **draft**: Set to `false` before publishing
- **tags**: Array of relevant tags

### Markdown Content

- Use ATX-style headers (`#`, `##`, `###`)
- Links: `[link text](URL)` or `[link text](/relative/path)`
- Images: `![alt text](image.jpg)` - place images in post folder
- Code blocks: Triple backticks with language identifier

### File Organization

- Blog posts: `content/posts/<post-title>/index.md`
- Images: Same folder as the post (`content/posts/<post-title>/image.jpg`)
- Static assets: `static/` directory

### Naming Conventions

- Post folders: Kebab-case (`homelab-kubernetes-part-1/`)
- No spaces in filenames
- Use descriptive, SEO-friendly titles

### Hugo Templates (Theme Development)

- Templates: `layouts/`
- Partials: `layouts/partials/`
- Shortcodes: `layouts/shortcodes/`
- Follow Go template syntax: `{{ .Variable }}`

---

## Common Workflows

### Creating a New Post
```bash
hugo new posts/my-new-post/index.md
```

### Adding Images
1. Create post folder: `content/posts/my-post/`
2. Add image to same folder
3. Reference as `![description](image.jpg)`

### Local Development
1. Run `hugo server -D` 
2. Access at `http://localhost:1313`
3. Content auto-reloads on changes

---

## What NOT To Do

- Do not commit generated `public/` directory (it's in .gitignore)
- Do not hardcode absolute URLs - use relative paths
- Do not leave `draft: true` in published posts
- Do not add large binary files to git (use git LFS or external hosting)

---

## Directory Structure

```
/
├── content/          # Markdown content (posts, pages)
├── static/           # Static assets (images, files)
├── layouts/          # Custom layouts (overrides theme)
├── themes/           # Hugo themes
├── hugo.toml         # Hugo configuration
├── archetypes/       # Content scaffolds
├── public/           # Generated output (do not edit)
└── assets/           # SCSS, JS, etc. (Hugo Pipes)
```

---

## Theme Information

- Theme: `eric-style` (in `themes/eric-style/`)
- Custom overrides: Place in root `layouts/` folder
- The theme uses SCSS for styling

---

## Notes for Agents

- This is a static content site - no runtime dependencies
- All content is in Markdown files
- Hugo handles all HTML generation
- No JavaScript testing or linting needed
- Focus on content structure and markdown correctness
