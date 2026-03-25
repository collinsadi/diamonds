use console::style;

pub fn render() {
    let art = [
        r"        /\        ",
        r"       /  \       ",
        r"      / ◆  \      ",
        r"     /      \     ",
        r"    / ◆    ◆ \    ",
        r"   /    ◆◆    \   ",
        r"  /  ◆      ◆  \  ",
        r" /________________\ ",
        r" \  ◆   ◆◆   ◆  / ",
        r"  \   ◆    ◆   /  ",
        r"   \    ◆◆    /   ",
        r"    \   ◆◆   /    ",
        r"     \  ◆◆  /     ",
        r"      \ ◆◆ /      ",
        r"       \  /       ",
        r"        \/        ",
    ];

    println!();
    for line in &art {
        println!("  {}", style(line).cyan());
    }
    println!();
    println!(
        "  {} {}",
        style("DIAMONDS").white().bold(),
        style("v2").cyan().bold()
    );
    println!(
        "  {}",
        style("EIP-2535 Diamond Standard Scaffold").dim()
    );
    println!();
}
