const API_URL = 'https://visitors.jkl.hacklab.fi/api/v1/visitors?format=json-v2'
const { createApp } = Vue

createApp({
    data() {
	return {
	    lab: { loading: true },
	    source: "REST API"
	}
    },
    created() {
	// Fetch once at init and then start a 60s interval timer
	this.fetchData()
	var that = this
	setInterval(function () {
	    that.fetchData.apply(that)
	}, 60000)
	// Start listening to Matrix client events
	window.addEventListener("message", this.matrixIncoming, false);
    },
    methods: {
	async fetchData() {
	    this.lab = await (await fetch(API_URL)).json()
	    this.lab.loading = false
	},
	matrixIncoming(event) {
	    if (event.data.api === "fromWidget" && event.data.response !== undefined) {
		// This is answer to us
		console.log("We got response, TODO process it", event)
	    } else if (event.data.api === "toWidget" && event.data.response === undefined) {
		// We got incoming information.
		console.log("Processing incoming event", event)
		const handler = {
		    capabilities : this.tellCapabilities,
		    notify_capabilities: this.checkCapabilities,
		}[event.data.action] ?? function () {
		    console.log("No handler for this action", event)
		}
		handler(event)
	    } else {
		// Either echo from postMessage or something else
		console.log("Visitor widget got unsolisited event", event)
	    }
	},
	tellCapabilities(event) {
	    // Telling we want the messages
	    event.data.response = { capabilities: ["m.capability.request_messages"] };
	    event.source.postMessage(event.data, "*");
	},
	checkCapabilities(event) {
	    if (event.data.data.approved.includes("m.capability.request_messages")) {
		// Matrix mode activated
		this.source = "Matrix"
	    } else {
		this.source = "REST API (Matrix-käyttöoikeus puuttuu)"
	    }
	    // Sending ack
	    event.data.response = {}
	    event.source.postMessage(event.data, "*")
	}
    }
}).mount('#app')

