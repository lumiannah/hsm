import LogoutButton from "./LogoutButton.js"
import Graph from "./Graph.js"
import { API_URL } from "../main.js"

export default {
    props: ['user'],
    components: {
        LogoutButton,
        Graph
    },
    data() {
        return {
            devices: null,
            timeInterval: 24,
            timeField: 'hour'
        }
    },
    watch: {

    },
    methods: {
        async getDevices() {
            const response = await fetch(`${API_URL}/devices`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timeInterval: this.timeInterval,
                    timeField: this.timeField
                })
            })
            if (!response.ok) {
                // not working
                console.log('sdf');
            }
            return await response.json()
        },
        async init() {
            console.log('inittt');
            this.devices = await this.getDevices()
            
        }
    },
    computed: {
        username() {
            return this.user.username
        },

    },
    async mounted() {
        try {
            console.log('mount wel');
            await this.init()
            
        } catch {
            console.log('no devices');
        }

    },
    template: `
    <div class="content">
        <h1>Hello, {{ username }}</h1>
        <logout-button></logout-button>
        <template v-if="devices">
            <graph :data="devices" :timeInterval="timeInterval" :timeField="timeField"></graph>
            <button @pointerup="timeInterval = 72, timeField = 'hour', init()">72 hours</button>
            <button @pointerup="timeInterval = 24, timeField = 'hour', init()">24 hours</button>
            <button @pointerup="timeInterval = 8, timeField = 'hour', init()">8 hours</button>
            <button @pointerup="timeInterval = 60, timeField = 'minute', init()">60 minutes</button>
        </template>
    </div>
    `
}