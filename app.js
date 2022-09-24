const API_URL = 'https://visitors.jkl.hacklab.fi/api/v1/visitors?format=json-v2'
const { createApp } = Vue

createApp({
    data() {
	return {
	    lab: { loading: true }
	}
    },
    created() {
	// Fetch once at init and then start a 60s interval timer
	this.fetchData()
	var that = this
	setInterval(function () {
	    that.fetchData.apply(that)
	}, 60000)
    },
    methods: {
	async fetchData() {
	    this.lab = await (await fetch(API_URL)).json()
	    this.lab.loading = false
	},
    }
}).mount('#app')


