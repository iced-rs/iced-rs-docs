<div class="example-code">

```rust
{% set source_file = "code/" ~ path -%}
{% set open_symbol = "//<" ~ section ~ ">" -%}
{% set close_symbol = "//</" ~ section ~ ">" -%}
{{ load_data(path=source_file) | split(pat=open_symbol) | nth(n=1) | split(pat=close_symbol) | nth(n=0) }}
```
{% set source_code_link = config.extra.code_dir ~ path -%}
<a href="{{ source_code_link }}">link to source</a>

</div>
