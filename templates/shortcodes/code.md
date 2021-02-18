```rust
{% set source_file = "code/" ~ path -%}
{% set open_symbol = "//<" ~ section ~ ">" -%}
{% set close_symbol = "//</" ~ section ~ ">" -%}
{# {{ load_data(path=source_file) | split(pat=open_symbol) | nth(n=1) | split(pat=close_symbol) | nth(n=0) | replace(from="    ", to="") | trim }} #}
{{ load_data(path=source_file) | split(pat=open_symbol) | nth(n=1) | split(pat=close_symbol) | nth(n=0) }}
```
