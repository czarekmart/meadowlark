
//************************************
function objectDump(obj, prefix, suffix) {

	if(prefix) console.log(prefix);

	for ( x in obj) {
		console.log("  [" + x + "] : " + obj[x] );
	}

	if(suffix) console.log(suffix);
}

module.exports.objectDump = objectDump;
