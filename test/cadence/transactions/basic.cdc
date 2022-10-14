// This is basic transaction
transaction(a: Int, b: Int){
    prepare(signer: AuthAccount){
        // log signer's address
        log(signer.Address)
    }
}