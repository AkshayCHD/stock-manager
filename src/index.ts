require("source-map-support").install();


const main = (temp: string) => {
	console.log("Process started");
	try {
		throw new Error(
			"sdfsffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
		);
	} catch (error) {
		console.log(error);
	}
};

main();
