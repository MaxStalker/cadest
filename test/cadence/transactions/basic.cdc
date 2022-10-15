// This is basic transaction
transaction{
    prepare(signer: AuthAccount){
        // log signer's address
        log("nice")
        log(signer.address)
    }
}