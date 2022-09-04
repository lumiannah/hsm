import { relLineGraph } from "../relLineGraph.js"

export default {
    props: ['data', 'timeInterval', 'timeField'],
    data() {
        return {
            graph: new relLineGraph({
                backgroundColor: 'rgb(223, 227, 236)',
                leftHeadingText: '°C Temperature',
                rightHeadingText: 'Humidity %',
                leftHeadingColor: 'hsla(0, 100%, 50%, 0.6)',
                rightHeadingColor: 'hsla(240, 100%, 50%, 0.6)',
            }),
            lineOptions_temperature: {
                headingLocation: 'left',
                lineColor: 'hsla(0, 100%, 50%, .6)',
                valueDivider: 0.01,
            },
            lineOptions_humidity: {
                headingLocation: 'right',
                lineColor: 'hsla(240, 100%, 50%, .6)',
                valueDivider: 0.01,
            },
        }
    },
    methods: {
        renderGraph() {

            for (const device of this.data) {
                const temperaturesData = device.data.map(datapoint => datapoint.temperature)
                const humiditiesData = device.data.map(datapoint => datapoint.humidity)
                this.graph.addLines(device.name, temperaturesData, this.lineOptions_temperature)
                this.graph.addLines(device.name, humiditiesData, this.lineOptions_humidity)
            }

            const datesData = this.data[0].data.map(datapoint => datapoint.ts)
            this.graph.addDates(datesData)
            this.graph.render()
        },
        
         
    },
    computed: {

    },
    watch: {
        data: {
            handler(newValue, oldValue) {
                this.graph.clearData()
                this.renderGraph()

            },
            deep: true
          }
    },
    mounted() {
        this.graph.init()
        this.renderGraph()
        this.graph.createGraphChooser()
    },
    updated() {

    },
    template: `
    <div class="rel-graph-container"></div>
    `
}