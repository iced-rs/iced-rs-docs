fn main() {
    //<test-section>
    println!("Hello, friend!");
    //</test-section>

    println!("Hello, end!");

    //<another-section>
    let _thing = vec![1, 2, 3];
    let _another_thing = vec![1, 2, 3];
    let _yup = match 1 {
        _ => (),
    };
    //</another-section>
}
