# iced.rs docs

## How to get started
- Install [zola](https://www.getzola.org/)
- clone repo
- cd into repo
- `zola serve`
- docs are located in `content/docs`

## how to add example code to to the docs
- code examples are in `code`
- create `cargo new some-new-example`
- add `some-new-example` to the workspace members in `code/Cargo.toml`
- write your code
- add a comment `//<section-name>` before your example snippet
- add a comment `//</section-name>` after your example snippet
- in your `content/docs/some_feature.md` include your code sample with:
    ```jinja
    {{ code(path="some-new-example/src/main.rs", section="section-name") }}
    ```

## Issues
- No source for tour
- Tour doesn't work with zola server (should be fixed on next update)

## TODOs
