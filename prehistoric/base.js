//const p = atob("eyJ0eXBlIjoiSW50IiwidmFsdWUiOiIxNDU3In0K")
//console.log(p);

const contract = `
	pub contract Basic{}
`
console.log(Buffer.from(contract, "utf8").toString("hex"))
console.log(btoa(contract).toString("hex"))