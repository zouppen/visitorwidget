const API_URL = 'https://visitors.jkl.hacklab.fi/api/v1/visitors?format=json-v2'
const { createApp } = Vue

createApp({
    data() {
	return {
	    lab: { loading: true },
	    jsdebug: "Huolletaan widgettiä, v1"
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
	    if (event.origin !== "vector://vector") {
		console.log("Visitor widget got unsolisited event", event)
		return
	    }

	    const handler = {
		capabilities : this.tellCapabilities,
	    }[event.data.action];	    
	    if (handler === undefined) {
		console.log("Visitor widget cannot process "+event.action, event)
		return
	    }

	    handler(event)
	},
	tellCapabilities(event) {
	    console.log("Ominaisuuksia kerrotaan", event)
	}
    }
}).mount('#app')


