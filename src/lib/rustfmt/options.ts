export type OptionKind = 'bool' | 'int' | 'enum' | 'string' | 'stringList'

export type OptionValue = boolean | number | string | string[]

export const CATEGORIES = [
  'Width & heuristics',
  'Indentation & whitespace',
  'Comments & docs',
  'Imports & modules',
  'Items & blocks',
  'Expressions & punctuation',
  'Macros & literals',
  'Edition',
  'Behavior',
] as const

export type Category = (typeof CATEGORIES)[number]

interface BaseOption {
  name: string
  category: Category
  description: string
  /** Stable options work on the stable toolchain; the rest require nightly. */
  stable: boolean
  /** Exists only on the nightly toolchain (absent from stable `--print-config`). */
  nightlyOnly?: boolean
  deprecated?: string
  /** Options that only affect the CLI and cannot be shown as a code preview. */
  noPreview?: boolean
}

export interface BoolOption extends BaseOption {
  kind: 'bool'
  default: boolean
}

export interface IntOption extends BaseOption {
  kind: 'int'
  default: number
  min: number
  max?: number
  /** When true, the value cannot exceed the configured `max_width`. */
  boundedByMaxWidth?: boolean
}

export interface EnumOption extends BaseOption {
  kind: 'enum'
  default: string
  values: readonly string[]
  /** Values that are only accepted on nightly even if the option itself is stable. */
  unstableValues?: readonly string[]
}

export interface StringOption extends BaseOption {
  kind: 'string'
  default: string
  placeholder?: string
}

export interface StringListOption extends BaseOption {
  kind: 'stringList'
  default: string[]
  placeholder?: string
}

export type OptionDef =
  BoolOption | IntOption | EnumOption | StringOption | StringListOption

const width = (name: string, def: number, description: string): IntOption => ({
  name,
  kind: 'int',
  default: def,
  min: 0,
  boundedByMaxWidth: true,
  category: 'Width & heuristics',
  stable: true,
  description,
})

export const OPTIONS: readonly OptionDef[] = [
  // Width & heuristics
  {
    name: 'max_width',
    kind: 'int',
    default: 100,
    min: 1,
    category: 'Width & heuristics',
    stable: true,
    description: 'Maximum width of each line.',
  },
  {
    name: 'use_small_heuristics',
    kind: 'enum',
    default: 'Default',
    values: ['Default', 'Off', 'Max'],
    category: 'Width & heuristics',
    stable: true,
    description:
      'How the width options below are derived. Default scales them from max_width, Off disables them, Max sets them all to max_width.',
  },
  width(
    'fn_call_width',
    60,
    'Maximum width of the arguments of a function call before it is split across lines.',
  ),
  width(
    'attr_fn_like_width',
    70,
    'Maximum width of the arguments of a function-like attribute before it is split.',
  ),
  width(
    'struct_lit_width',
    18,
    'Maximum width in the body of a struct literal before it is split.',
  ),
  width(
    'struct_variant_width',
    35,
    'Maximum width in the body of a struct variant before it is split.',
  ),
  width(
    'array_width',
    60,
    'Maximum width of an array literal before it is split.',
  ),
  width(
    'chain_width',
    60,
    'Maximum width of a method chain that fits on one line.',
  ),
  width(
    'single_line_if_else_max_width',
    50,
    'Maximum line length for single-line if-else expressions. 0 means always multi-line.',
  ),
  width(
    'single_line_let_else_max_width',
    50,
    'Maximum line length for single-line let-else statements. 0 means the else block always goes on its own lines.',
  ),
  {
    name: 'short_array_element_width_threshold',
    kind: 'int',
    default: 10,
    min: 0,
    category: 'Width & heuristics',
    stable: true,
    description:
      'Arrays whose elements are all at most this wide are laid out compactly, several per line.',
  },

  // Indentation & whitespace
  {
    name: 'hard_tabs',
    kind: 'bool',
    default: false,
    category: 'Indentation & whitespace',
    stable: true,
    description: 'Indent with tabs instead of spaces.',
  },
  {
    name: 'tab_spaces',
    kind: 'int',
    default: 4,
    min: 1,
    category: 'Indentation & whitespace',
    stable: true,
    description: 'Number of spaces per indentation level.',
  },
  {
    name: 'newline_style',
    kind: 'enum',
    default: 'Auto',
    values: ['Auto', 'Native', 'Unix', 'Windows'],
    category: 'Indentation & whitespace',
    stable: true,
    noPreview: true,
    description:
      'Line endings. Auto uses the first line ending found in each file; Native uses the platform default.',
  },
  {
    name: 'indent_style',
    kind: 'enum',
    default: 'Block',
    values: ['Block', 'Visual'],
    category: 'Indentation & whitespace',
    stable: false,
    description:
      'Block indents continuation lines by one level. Visual aligns them with the opening delimiter.',
  },
  {
    name: 'blank_lines_upper_bound',
    kind: 'int',
    default: 1,
    min: 0,
    category: 'Indentation & whitespace',
    stable: false,
    description:
      'Maximum number of consecutive blank lines kept between items and statements.',
  },
  {
    name: 'blank_lines_lower_bound',
    kind: 'int',
    default: 0,
    min: 0,
    category: 'Indentation & whitespace',
    stable: false,
    description:
      'Minimum number of blank lines between items and statements. Must not exceed blank_lines_upper_bound.',
  },
  {
    name: 'type_punctuation_density',
    kind: 'enum',
    default: 'Wide',
    values: ['Wide', 'Compressed'],
    category: 'Indentation & whitespace',
    stable: false,
    description:
      'Spaces around the + and = in type bounds and defaults (T: A + B vs T: A+B).',
  },
  {
    name: 'space_before_colon',
    kind: 'bool',
    default: false,
    category: 'Indentation & whitespace',
    stable: false,
    description: 'Add a space before the colon in type annotations.',
  },
  {
    name: 'space_after_colon',
    kind: 'bool',
    default: true,
    category: 'Indentation & whitespace',
    stable: false,
    description: 'Add a space after the colon in type annotations.',
  },
  {
    name: 'spaces_around_ranges',
    kind: 'bool',
    default: false,
    category: 'Indentation & whitespace',
    stable: false,
    description: 'Put spaces around range operators (0 .. 10).',
  },

  // Comments & docs
  {
    name: 'wrap_comments',
    kind: 'bool',
    default: false,
    category: 'Comments & docs',
    stable: false,
    description: 'Wrap comments that are longer than comment_width.',
  },
  {
    name: 'comment_width',
    kind: 'int',
    default: 80,
    min: 0,
    category: 'Comments & docs',
    stable: false,
    description:
      'Maximum length of comments. Only applies when wrap_comments is on.',
  },
  {
    name: 'normalize_comments',
    kind: 'bool',
    default: false,
    category: 'Comments & docs',
    stable: false,
    description: 'Convert /* */ comments to // comments where possible.',
  },
  {
    name: 'normalize_doc_attributes',
    kind: 'bool',
    default: false,
    category: 'Comments & docs',
    stable: false,
    description: 'Convert #[doc = "..."] attributes to /// doc comments.',
  },
  {
    name: 'format_code_in_doc_comments',
    kind: 'bool',
    default: false,
    category: 'Comments & docs',
    stable: false,
    description: 'Format Rust code blocks inside doc comments.',
  },
  {
    name: 'doc_comment_code_block_width',
    kind: 'int',
    default: 100,
    min: 0,
    category: 'Comments & docs',
    stable: false,
    description:
      'Maximum width of code in doc comments when format_code_in_doc_comments is on.',
  },
  {
    name: 'doc_comment_code_block_small_heuristics',
    kind: 'enum',
    default: 'Inherit',
    values: ['Inherit', 'Default', 'Off', 'Max'],
    category: 'Comments & docs',
    stable: false,
    nightlyOnly: true,
    description:
      'use_small_heuristics for code in doc comments. Inherit uses the value set for the rest of the file.',
  },

  // Imports & modules
  {
    name: 'reorder_imports',
    kind: 'bool',
    default: true,
    category: 'Imports & modules',
    stable: true,
    description: 'Sort consecutive use statements alphabetically.',
  },
  {
    name: 'reorder_modules',
    kind: 'bool',
    default: true,
    category: 'Imports & modules',
    stable: true,
    description: 'Sort consecutive mod declarations alphabetically.',
  },
  {
    name: 'imports_granularity',
    kind: 'enum',
    default: 'Preserve',
    values: ['Preserve', 'Crate', 'Module', 'Item', 'One'],
    category: 'Imports & modules',
    stable: false,
    description:
      'Merge or split imports: one use per crate, per module, per item, or one use for everything.',
  },
  {
    name: 'group_imports',
    kind: 'enum',
    default: 'Preserve',
    values: ['Preserve', 'StdExternalCrate', 'One'],
    category: 'Imports & modules',
    stable: false,
    description:
      'Group imports. StdExternalCrate makes three groups: std/core/alloc, external crates, then self/super/crate.',
  },
  {
    name: 'imports_layout',
    kind: 'enum',
    default: 'Mixed',
    values: ['Mixed', 'Horizontal', 'HorizontalVertical', 'Vertical'],
    category: 'Imports & modules',
    stable: false,
    description: 'How the items inside a nested import list are laid out.',
  },
  {
    name: 'imports_indent',
    kind: 'enum',
    default: 'Block',
    values: ['Block', 'Visual'],
    category: 'Imports & modules',
    stable: false,
    description: 'Indentation style of nested import lists.',
  },

  // Items & blocks
  {
    name: 'brace_style',
    kind: 'enum',
    default: 'SameLineWhere',
    values: ['SameLineWhere', 'AlwaysNextLine', 'PreferSameLine'],
    category: 'Items & blocks',
    stable: false,
    description: 'Where the opening brace of items (fn, struct, impl) goes.',
  },
  {
    name: 'control_brace_style',
    kind: 'enum',
    default: 'AlwaysSameLine',
    values: ['AlwaysSameLine', 'ClosingNextLine', 'AlwaysNextLine'],
    category: 'Items & blocks',
    stable: false,
    description: 'Brace style for control flow such as if, else, for and loop.',
  },
  {
    name: 'fn_params_layout',
    kind: 'enum',
    default: 'Tall',
    values: ['Tall', 'Compressed', 'Vertical'],
    category: 'Items & blocks',
    stable: true,
    description: 'Layout of function parameters that do not fit on one line.',
  },
  {
    name: 'fn_single_line',
    kind: 'bool',
    default: false,
    category: 'Items & blocks',
    stable: false,
    description: 'Put a function with a single-expression body on one line.',
  },
  {
    name: 'where_single_line',
    kind: 'bool',
    default: false,
    category: 'Items & blocks',
    stable: false,
    description: 'Keep a where clause with a single predicate on one line.',
  },
  {
    name: 'empty_item_single_line',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: false,
    description: 'Put empty-bodied functions and impls on a single line.',
  },
  {
    name: 'struct_lit_single_line',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: false,
    description:
      'Put small struct literals on one line, up to struct_lit_width.',
  },
  {
    name: 'struct_field_align_threshold',
    kind: 'int',
    default: 0,
    min: 0,
    category: 'Items & blocks',
    stable: false,
    description:
      'Align struct field types when field names are at most this long. 0 turns alignment off.',
  },
  {
    name: 'enum_discrim_align_threshold',
    kind: 'int',
    default: 0,
    min: 0,
    category: 'Items & blocks',
    stable: false,
    description:
      'Align enum discriminants when variant names are at most this long. 0 turns alignment off.',
  },
  {
    name: 'reorder_impl_items',
    kind: 'bool',
    default: false,
    category: 'Items & blocks',
    stable: false,
    description: 'Put type and const items before methods in impl blocks.',
  },
  {
    name: 'force_multiline_blocks',
    kind: 'bool',
    default: false,
    category: 'Items & blocks',
    stable: false,
    description:
      'Always wrap multi-line closure and match arm bodies in a block.',
  },
  {
    name: 'match_arm_blocks',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: false,
    description:
      'Wrap the body of a match arm in a block when it does not fit on the same line as the =>.',
  },
  {
    name: 'match_arm_leading_pipes',
    kind: 'enum',
    default: 'Never',
    values: ['Never', 'Always', 'Preserve'],
    category: 'Items & blocks',
    stable: true,
    description: 'Leading | in match arm patterns.',
  },
  {
    name: 'match_arm_indent',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: false,
    description: 'Indent match arms one level inside the match block.',
  },
  {
    name: 'match_block_trailing_comma',
    kind: 'bool',
    default: false,
    category: 'Items & blocks',
    stable: true,
    description: 'Add a trailing comma after match arms whose body is a block.',
  },
  {
    name: 'merge_derives',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: true,
    description: 'Merge consecutive derive attributes into one.',
  },
  {
    name: 'inline_attribute_width',
    kind: 'int',
    default: 0,
    min: 0,
    category: 'Items & blocks',
    stable: false,
    description:
      'Put an attribute on the same line as its item if it fits in this width. 0 turns this off.',
  },
  {
    name: 'force_explicit_abi',
    kind: 'bool',
    default: true,
    category: 'Items & blocks',
    stable: true,
    description: 'Always write extern "C" instead of a bare extern.',
  },

  // Expressions & punctuation
  {
    name: 'trailing_comma',
    kind: 'enum',
    default: 'Vertical',
    values: ['Vertical', 'Always', 'Never'],
    category: 'Expressions & punctuation',
    stable: false,
    description:
      'Trailing commas in lists. Vertical adds them only when a list spans multiple lines.',
  },
  {
    name: 'trailing_semicolon',
    kind: 'bool',
    default: true,
    category: 'Expressions & punctuation',
    stable: false,
    description: 'Add a trailing semicolon after break, continue and return.',
  },
  {
    name: 'binop_separator',
    kind: 'enum',
    default: 'Front',
    values: ['Front', 'Back'],
    category: 'Expressions & punctuation',
    stable: false,
    description:
      'Where a binary operator goes when an expression is split across lines.',
  },
  {
    name: 'combine_control_expr',
    kind: 'bool',
    default: true,
    category: 'Expressions & punctuation',
    stable: false,
    description:
      'Combine a control expression that is the last argument of a call with the call.',
  },
  {
    name: 'overflow_delimited_expr',
    kind: 'bool',
    default: false,
    category: 'Expressions & punctuation',
    stable: false,
    description:
      'Let the last struct, slice or array argument of a call run over multiple lines without splitting the call.',
  },
  {
    name: 'remove_nested_parens',
    kind: 'bool',
    default: true,
    category: 'Expressions & punctuation',
    stable: true,
    description: 'Remove redundant nested parentheses: ((x)) becomes (x).',
  },
  {
    name: 'use_field_init_shorthand',
    kind: 'bool',
    default: false,
    category: 'Expressions & punctuation',
    stable: true,
    description: 'Write Foo { x } instead of Foo { x: x }.',
  },
  {
    name: 'use_try_shorthand',
    kind: 'bool',
    default: false,
    category: 'Expressions & punctuation',
    stable: true,
    description: 'Replace the try! macro with the ? operator.',
  },
  {
    name: 'condense_wildcard_suffixes',
    kind: 'bool',
    default: false,
    category: 'Expressions & punctuation',
    stable: false,
    description:
      'Replace trailing wildcards in tuple patterns with a single .. .',
  },

  // Macros & literals
  {
    name: 'format_macro_matchers',
    kind: 'bool',
    default: false,
    category: 'Macros & literals',
    stable: false,
    description: 'Format the matchers of macro_rules! definitions.',
  },
  {
    name: 'format_macro_bodies',
    kind: 'bool',
    default: true,
    category: 'Macros & literals',
    stable: false,
    description: 'Format the bodies of declarative macro definitions.',
  },
  {
    name: 'skip_macro_invocations',
    kind: 'stringList',
    default: [],
    category: 'Macros & literals',
    stable: false,
    placeholder: 'e.g. lazy_static or *',
    description:
      'Macro invocations that rustfmt should leave alone. "*" skips all macro invocations.',
  },
  {
    name: 'format_strings',
    kind: 'bool',
    default: false,
    category: 'Macros & literals',
    stable: false,
    description: 'Break string literals that are too long across lines.',
  },
  {
    name: 'hex_literal_case',
    kind: 'enum',
    default: 'Preserve',
    values: ['Preserve', 'Upper', 'Lower'],
    category: 'Macros & literals',
    stable: false,
    description: 'Letter case of hexadecimal literals.',
  },
  {
    name: 'float_literal_trailing_zero',
    kind: 'enum',
    default: 'Preserve',
    values: ['Preserve', 'Always', 'IfNoPostfix', 'Never'],
    category: 'Macros & literals',
    stable: false,
    description: 'Add or remove a trailing .0 on float literals.',
  },

  // Edition
  {
    name: 'edition',
    kind: 'enum',
    default: '2015',
    values: ['2015', '2018', '2021', '2024'],
    category: 'Edition',
    stable: true,
    description:
      'Rust edition used to parse the code. Cargo passes this automatically; set it for standalone rustfmt runs.',
  },
  {
    name: 'style_edition',
    kind: 'enum',
    default: '2015',
    values: ['2015', '2018', '2021', '2024', '2027'],
    unstableValues: ['2027'],
    category: 'Edition',
    stable: true,
    description:
      'Formatting rules to use. Style editions can change formatting without changing the language edition.',
  },
  {
    name: 'version',
    kind: 'enum',
    default: 'One',
    values: ['One', 'Two'],
    category: 'Edition',
    stable: false,
    deprecated: 'Use style_edition instead.',
    description: 'Older switch between formatting rule sets.',
  },

  // Behavior
  {
    name: 'required_version',
    kind: 'string',
    default: '1.9.0',
    category: 'Behavior',
    stable: false,
    noPreview: true,
    placeholder: '>=1.9.0',
    description:
      'Fail unless the running rustfmt matches this version requirement.',
  },
  {
    name: 'unstable_features',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Allow unstable options. Only works on nightly.',
  },
  {
    name: 'disable_all_formatting',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: true,
    description: 'Turn formatting off entirely.',
  },
  {
    name: 'format_generated_files',
    kind: 'bool',
    default: true,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Format files marked @generated near the top.',
  },
  {
    name: 'generated_marker_line_search_limit',
    kind: 'int',
    default: 5,
    min: 0,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Number of lines to search for the @generated marker.',
  },
  {
    name: 'skip_children',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: "Don't format out-of-line modules.",
  },
  {
    name: 'ignore',
    kind: 'stringList',
    default: [],
    category: 'Behavior',
    stable: false,
    noPreview: true,
    placeholder: 'e.g. src/generated.rs or examples',
    description:
      'Files and directories to skip. Paths are relative to the rustfmt.toml file.',
  },
  {
    name: 'show_parse_errors',
    kind: 'bool',
    default: true,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Show errors from the parser.',
  },
  {
    name: 'error_on_line_overflow',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Report an error when a line exceeds max_width.',
  },
  {
    name: 'error_on_unformatted',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description:
      'Report an error when rustfmt cannot format code such as comments or string literals.',
  },
  {
    name: 'color',
    kind: 'enum',
    default: 'Auto',
    values: ['Auto', 'Always', 'Never'],
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Colored terminal output.',
  },
  {
    name: 'emit_mode',
    kind: 'enum',
    default: 'Files',
    values: [
      'Files',
      'Stdout',
      'Coverage',
      'Checkstyle',
      'Json',
      'ModifiedLines',
      'Diff',
    ],
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description:
      'What rustfmt produces: overwritten files, stdout, a diff, and so on.',
  },
  {
    name: 'make_backup',
    kind: 'bool',
    default: false,
    category: 'Behavior',
    stable: false,
    noPreview: true,
    description: 'Back up each file as .bk before formatting it.',
  },
]

export const OPTION_BY_NAME: ReadonlyMap<string, OptionDef> = new Map(
  OPTIONS.map((o) => [o.name, o]),
)

export const DOCS_BASE = 'https://rust-lang.github.io/rustfmt/'

export function docsUrl(name: string) {
  return `${DOCS_BASE}#${name}`
}

export function isDefault(def: OptionDef, value: OptionValue) {
  if (Array.isArray(def.default)) {
    return (
      Array.isArray(value) &&
      value.length === def.default.length &&
      value.every((v, i) => v === (def.default as string[])[i])
    )
  }
  return value === def.default
}

/** True when this value only works on the nightly toolchain. */
export function requiresNightly(def: OptionDef, value: OptionValue) {
  if (!def.stable) return true
  return (
    def.kind === 'enum' &&
    (def.unstableValues?.includes(value as string) ?? false)
  )
}
