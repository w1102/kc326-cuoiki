const channelID = 1421792
const readAPIKey = 'DWTWKRWRYGQYONOM'
const writeAPIKey = 'SSDLCZWNRHIVMJUF'

const updateLimit = 15000

let lastedWriteTime = 0

let dispatchData = { fieldName: [], fieldValue: [] }


const getFieldIngoreNull = async (fieldName, fieldID) => {
	
	// get length of field
	let url = 'https://api.thingspeak.com/channels/' + channelID + '/fields/' + fieldID + '/last.json?api_key=' + readAPIKey
	const lastedEntryID = JSON.parse(await makeRequest('GET', url))['entry_id']
	
	// get field
	url = 'https://api.thingspeak.com/channels/' + channelID + '/fields/' + fieldID + '.json?api_key=' + readAPIKey + '&results=' + lastedEntryID
	const rawData = JSON.parse(await makeRequest('GET', url))['feeds']
	
	// ignore null value of field
	const data = []
	for (const rawdata of rawData) {
		if (rawdata[fieldName] != null)
			data.push( parseInt(rawdata[fieldName]) )
	}
	
	// console.log(url)
	// console.log(rawData, data)
	
	return data	
}

const getLastedFieldValue = async (fieldName, fieldID) => {
	const url = 'https://api.thingspeak.com/channels/' + channelID + '/fields/' + fieldID + '/last.json?api_key=' + readAPIKey

	const data = JSON.parse(await makeRequest('GET', url))

	return parseInt(data[fieldName])
}

const sendFieldDispatch = async (fieldName, value) => {

	// check if fieldName is exist in dispatchData then change new value
	if (dispatchData.fieldName.includes(fieldName)) {
		dispatchData.fieldName.forEach((field, idx) => {
			if (field == fieldName) {
				// console.log('dispatch: changing field: ', field, value)

				dispatchData.fieldValue[idx] = value
			}
		})
	}
	// if fieldName does not exist in dispatchData then add this field to dispatchData
	else {
		// console.log('dispatch: adding field: ', fieldName, value)

		dispatchData.fieldName.push(fieldName)
		dispatchData.fieldValue.push(value)
	}

	// send dispatch
	if (IsSendAvailable()) {
		await sendFields()
		
	} else {
		const delay = 1000
		const elapsedTime = (Date.now() - lastedWriteTime) // the number of milliseconds elapsed since lastedWriteTime
		
		setTimeout(async () => await sendFields(), updateLimit + delay - elapsedTime)
	}


}

// send multiple field in once
const sendFields = async () => {

	if ((IsSendAvailable() == false)) { return }
	lastedWriteTime = Date.now()

	let url = 'https://api.thingspeak.com/update?api_key=' + writeAPIKey

	dispatchData.fieldName.forEach((field, idx) => {
		url += '&' + field + '=0' + dispatchData.fieldValue[idx]
	})

	let last_entry_id = await makeRequest('GET', url)

	// console.log(last_entry_id)

}

// send one field in once
const sendField = async (fieldName, value) => {

	while (IsSendAvailable() == false) {}

	let url = 'https://api.thingspeak.com/update?api_key=' + writeAPIKey + '&' + fieldName + '=0' + value

	let tt = await makeRequest('GET', url)

	console.log(tt)

	lastedWriteTime = Date.now()
}

async function ww() {
	return (Date.now() - lastedWriteTime >= updateLimit)
}
	

const IsSendAvailable = () => {
	return (Date.now() - lastedWriteTime >= updateLimit)
}


function makeRequest(method, url) {
	return new Promise(function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.onload = function() {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.responseText);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function() {
			reject({
				status: this.status,
				statusText: xhr.statusText
			});
		};
		xhr.send();
	});
}


export { getLastedFieldValue, sendField, sendFieldDispatch, getFieldIngoreNull }
