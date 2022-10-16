pub contract Basic{
    pub var nonce: Int

    pub fun inc(){
        self.nonce = self.nonce + 1
    }

    pub fun setNonce(newNonce: Int){
        self.nonce = newNonce
    }

    init(){
        self.nonce = 1337
    }
}