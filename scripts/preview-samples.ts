// Rust inputs for the per-option previews. Each sample is written to make the
// option's effect visible: rustfmt formats it once with the default value and
// once per alternative value, and the site shows the difference.

type Value = boolean | number | string | string[]

export interface PreviewSpec {
  sample: string
  /** Int values to snapshot (the default is always added). */
  ints?: number[]
  /** String list values to snapshot (the default is always added). */
  lists?: string[][]
  /** Other options needed for this one to have any effect. */
  context?: Record<string, Value>
}

const longSignature = `fn process_order(order: &Order, inventory: &mut Inventory, notifier: &dyn Notifier) -> Result<Receipt, OrderError> {
    let receipt = build_receipt(order, inventory.reserve(order.items())?, notifier.channel());
    Ok(receipt)
}
`

const smallHeuristics = `fn main() {
    let point = Point { x: 1, y: 2, z: 3 };
    let names = vec!["alice_example", "bob_example", "carol_example", "dave_example"];
    let total = orders.iter().filter(|o| o.paid).map(|o| o.amount).sum::<u64>();
    let label = if count == 1 { "item" } else { "items" };
    send_message(recipient_address, message_body, retry_count, timeout);
}
`

const nested = `mod server {
    pub fn handle(request: Request) -> Response {
        match request.method() {
            Method::Get => {
                if let Some(page) = cache.get(request.path()) {
                    return page.clone();
                }
                render(request)
            }
            _ => Response::not_allowed(),
        }
    }
}
`

const imports = `use crate::models::User;
use std::collections::HashMap;
use serde::Deserialize;

use super::helpers;
use std::collections::HashSet;
use std::io::{self, Read};
use anyhow::Result;
use crate::models::Order;
`

const longImport = `use crate::models::{Account, Address, Invoice, LineItem, Order, Payment, Product, Refund, Shipment};
`

const editionSensitive = `use std::num::{NonZeroU64, NonZeroU16, NonZeroU8, NonZeroU32};

fn main() {
    let value = some_function_with_a_long_name(first_argument).await_like_method_call().unwrap_or_default();
    let is_valid = matches!(state, State::Ready | State::Running if value > threshold_value_for_state);
}
`

const messy = `fn   main(){
let   x=1;let y =   2;
    println!("{}",x+y);
}
`

export const PREVIEWS: Record<string, PreviewSpec> = {
  max_width: { sample: longSignature, ints: [60, 80, 120] },
  use_small_heuristics: { sample: smallHeuristics },
  fn_call_width: {
    sample: `fn main() {
    send_message(recipient_address, message_body, retry_count);
    log(level, text);
}
`,
    ints: [20, 40, 80],
  },
  attr_fn_like_width: {
    sample: `#[cfg(all(target_os = "linux", feature = "io_uring", not(test)))]
fn setup() {}
`,
    ints: [30, 50, 90],
  },
  struct_lit_width: {
    sample: `fn main() {
    let p = Point { x: 1, y: 2 };
    let c = Color { red: 255, green: 128, blue: 0 };
}
`,
    ints: [0, 30, 50],
  },
  struct_variant_width: {
    sample: `enum Shape {
    Circle { radius: f64 },
    Rect { width: f64, height: f64 },
    Triangle { a: f64, b: f64, c: f64 },
}
`,
    ints: [0, 20, 50],
  },
  array_width: {
    sample: `fn main() {
    let stages = ["alpha_release", "beta_release", "release_candidate", "stable"];
}
`,
    ints: [20, 40, 80],
  },
  chain_width: {
    sample: `fn main() {
    let total = orders.iter().filter(|o| o.paid).map(|o| o.amount).sum::<u64>();
}
`,
    ints: [20, 40, 80],
  },
  single_line_if_else_max_width: {
    sample: `fn main() {
    let label = if count == 1 { "item" } else { "items" };
}
`,
    ints: [0, 30, 80],
  },
  single_line_let_else_max_width: {
    sample: `fn main() {
    let Some(user) = find_user(id) else { return };
}
`,
    ints: [0, 30, 80],
  },
  short_array_element_width_threshold: {
    sample: `fn main() {
    let table = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700];
}
`,
    ints: [0, 2, 20],
  },

  hard_tabs: { sample: nested },
  tab_spaces: { sample: nested, ints: [2, 3, 8] },
  indent_style: { sample: longSignature },
  blank_lines_upper_bound: {
    sample: `fn first() {}



fn second() {
    let a = 1;


    let b = 2;
}
`,
    ints: [0, 2, 3],
  },
  blank_lines_lower_bound: {
    sample: `fn first() {}
fn second() {
    let a = 1;
    let b = 2;
}
`,
    ints: [1],
    context: { blank_lines_upper_bound: 2 },
  },
  type_punctuation_density: {
    sample: `fn spawn<T: Send + Sync + 'static, E = Error>(task: T) {}
`,
  },
  space_before_colon: {
    sample: `struct Point {
    x: i32,
}

fn scale(p: Point, factor: i32) -> i32 {
    let x: i32 = p.x * factor;
    x
}
`,
  },
  space_after_colon: {
    sample: `struct Point {
    x: i32,
}

fn scale(p: Point, factor: i32) -> i32 {
    let x: i32 = p.x * factor;
    x
}
`,
  },
  spaces_around_ranges: {
    sample: `fn main() {
    for i in 0..10 {
        let window = &data[i..=i + 2];
    }
}
`,
  },

  wrap_comments: {
    sample: `// This comment is deliberately long so that it runs well past the configured comment width and has to wrap.
fn main() {}
`,
  },
  comment_width: {
    sample: `// This comment is deliberately long so that it runs well past the configured comment width and has to wrap.
fn main() {}
`,
    ints: [40, 60, 100],
    context: { wrap_comments: true },
  },
  normalize_comments: {
    sample: `/* Starts the server. */
fn main() {
    let port = 8080; /* default port */
}
`,
  },
  normalize_doc_attributes: {
    sample: `#[doc = "Adds one to the number given."]
fn add_one(x: i32) -> i32 {
    x + 1
}
`,
  },
  format_code_in_doc_comments: {
    sample: `/// Adds one to the number given.
///
/// \`\`\`
/// let five=5;
/// assert_eq!(6,add_one(five));
/// \`\`\`
fn add_one(x: i32) -> i32 {
    x + 1
}
`,
  },
  doc_comment_code_block_width: {
    sample: `/// \`\`\`
/// let total_price = base_price + shipping_cost + import_duty + sales_tax_amount;
/// \`\`\`
fn total() {}
`,
    ints: [40, 60, 80],
    context: { format_code_in_doc_comments: true },
  },
  doc_comment_code_block_small_heuristics: {
    sample: `/// \`\`\`
/// let label = if count == 1 { "item" } else { "items" };
/// send_message(recipient_address, message_body, retry_count, timeout);
/// \`\`\`
fn example() {}
`,
    context: { format_code_in_doc_comments: true },
  },

  reorder_imports: { sample: imports },
  reorder_modules: {
    sample: `mod routes;
mod config;
mod auth;
`,
  },
  imports_granularity: { sample: imports },
  group_imports: { sample: imports },
  imports_layout: { sample: longImport },
  imports_indent: { sample: longImport },

  brace_style: {
    sample: `struct Config {
    name: String,
}

impl Config {
    fn load<P>(path: P) -> Self
    where
        P: AsRef<Path>,
    {
        todo!()
    }
}
`,
  },
  control_brace_style: {
    sample: `fn main() {
    if ready {
        start();
    } else {
        wait();
    }
    for job in queue {
        run(job);
    }
}
`,
  },
  fn_params_layout: {
    sample: `fn add(a: i32, b: i32) -> i32 {}

fn create_user(name: String, email: String, age: u32, country: Country, referrer: Option<UserId>, newsletter: bool) {}
`,
  },
  fn_single_line: {
    sample: `fn double(x: i32) -> i32 {
    x * 2
}
`,
  },
  where_single_line: {
    sample: `fn describe<T>(value: T) -> String
where
    T: Display,
{
    value.to_string()
}
`,
  },
  empty_item_single_line: {
    sample: `fn noop() {}

impl Marker for Unit {}
`,
  },
  struct_lit_single_line: {
    sample: `fn main() {
    let p = Point { x: 1, y: 2 };
}
`,
  },
  struct_field_align_threshold: {
    sample: `struct Server {
    id: u32,
    hostname: String,
    port: u16,
    max_connections: usize,
}
`,
    ints: [10, 20],
  },
  enum_discrim_align_threshold: {
    sample: `enum Status {
    Ok = 200,
    NotFound = 404,
    InternalServerError = 500,
}
`,
    ints: [10, 20],
  },
  reorder_impl_items: {
    sample: `impl Iterator for Counter {
    fn next(&mut self) -> Option<u32> {
        None
    }
    type Item = u32;
}
`,
  },
  force_multiline_blocks: {
    sample: `fn main() {
    result.and_then(|maybe_value| match maybe_value {
        None => fallback(),
        Some(value) => process(value),
    });
}
`,
  },
  match_arm_blocks: {
    sample: `fn main() {
    match event {
        Event::Click => handle_click_event_with_long_name(position, button, modifiers, timestamp_value),
        _ => {}
    }
}
`,
  },
  match_arm_leading_pipes: {
    sample: `fn main() {
    match key {
        | Key::Up | Key::Down => scroll(),
        Key::Enter => submit(),
        _ => {}
    }
}
`,
  },
  match_arm_indent: {
    sample: `fn main() {
    match key {
        Key::Enter => submit(),
        _ => {}
    }
}
`,
  },
  match_block_trailing_comma: {
    sample: `fn main() {
    match result {
        Ok(value) => {
            save(value);
        }
        Err(err) => {
            report(err);
        }
    }
}
`,
  },
  merge_derives: {
    sample: `#[derive(Debug)]
#[derive(Clone, PartialEq)]
struct Token;
`,
  },
  inline_attribute_width: {
    sample: `#[cfg(feature = "alloc")]
use alloc::vec::Vec;
#[cfg(test)]
mod tests;
`,
    ints: [30, 50],
  },
  force_explicit_abi: {
    sample: `extern {
    fn strlen(s: *const c_char) -> usize;
}
`,
  },

  trailing_comma: {
    sample: `fn main() {
    let config = Config { name: String::from("server"), port: 8080, workers: 4, verbose: true };
    let pair = (1, 2);
}
`,
  },
  trailing_semicolon: {
    sample: `fn first() -> usize {
    return 0
}

fn drain() {
    loop {
        break
    }
}
`,
  },
  binop_separator: {
    sample: `fn main() {
    let ready = connection_established && handshake_completed && credentials_verified && !shutdown_requested;
}
`,
  },
  combine_control_expr: {
    sample: `fn main() {
    let value = compute(if use_cache { cached_value(key) } else { fetch_value_from_remote_server(key, timeout) });
}
`,
  },
  overflow_delimited_expr: {
    sample: `fn main() {
    let server = Server::new(config, vec![first_route_handler, second_route_handler, third_route_handler]);
}
`,
  },
  remove_nested_parens: {
    sample: `fn main() {
    let total = ((price + tax));
}
`,
  },
  use_field_init_shorthand: {
    sample: `fn main() {
    let point = Point { x: x, y: y, z: 0 };
}
`,
  },
  use_try_shorthand: {
    sample: `fn read_config(path: &str) -> Result<String, io::Error> {
    let text = try!(fs::read_to_string(path));
    Ok(text)
}
`,
  },
  condense_wildcard_suffixes: {
    sample: `fn main() {
    let (first, _, _, _) = tuple;
}
`,
  },

  format_macro_matchers: {
    sample: `macro_rules! point {
    ($x:expr , $y :expr) => {
        Point { x: $x, y: $y }
    };
}
`,
  },
  format_macro_bodies: {
    sample: `macro_rules! point {
    ($x:expr, $y:expr) => {
        Point{x:$x,y:$y}
    };
}
`,
  },
  skip_macro_invocations: {
    sample: `fn main() {
    let v = vec![1,2,   3];
    let q = query!(select,   from,users);
}
`,
    lists: [['*'], ['query']],
  },
  format_strings: {
    sample: `fn main() {
    let message = "This string literal is deliberately long so that it runs well past the maximum line width.";
}
`,
  },
  hex_literal_case: {
    sample: `fn main() {
    let mask = 0xDeadBeef;
    let flag = 0xff;
}
`,
  },
  float_literal_trailing_zero: {
    sample: `fn main() {
    let a = 1.;
    let b = 2.0;
    let c = 3.0_f32;
    let d = 4f64;
}
`,
  },

  edition: { sample: editionSensitive },
  style_edition: { sample: editionSensitive },
  version: { sample: editionSensitive },
  disable_all_formatting: { sample: messy },
}
