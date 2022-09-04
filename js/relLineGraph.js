export function relLineGraph(options) {

    const PADDING = 60
    const POINT_RADIUS = 2 // for visualizing lonely data points
    const SMALL_POINT_RADIUS = 0.1 // for fixing the spike at sharp line angle
    const DEFAULT_HEIGHT = 600

    let defaultOptions = {
        fontSize: 16,
        fontFamily: 'Courier New',
        backgroundColor: 'rgb(223, 227, 236)',
        verticalBackgroundColor: 'rgb(207, 215, 232)',
        separatorLineWidth: 2,
        separatorLineColor: '#fff',
        leftHeadingText: '°C Temperature',
        leftHeadingColor: 'hsla(0, 100%, 50%, 0.6)',
        leftValueStep: 5,
        rightHeadingText: '°Humidity %',
        rightHeadingColor: 'hsla(240, 100%, 50%, 0.6)',
        rightValueStep: 5,
        graphHeight: DEFAULT_HEIGHT

    }

    let graphOptions = { ...defaultOptions, ...options }
    graphOptions.font = `${graphOptions.fontSize}px ${graphOptions.fontFamily}`

    let _this = this
    let w, h, dataPoints, pointWidth, graphContainer
    let graphs = []
    let dates = {}
    let activeDevices = new Set()

    let leftVerticalValues = {}, rightVerticalValues = {}

    let canvases = {
        final_render: {
            el: null,
            ctx: null
        },
        layer_verticalSeparators: {
            el: null,
            ctx: null
        },
        layer_horizontalSeparators: {
            el: null,
            ctx: null
        },
        layer_lines: {
            el: null,
            ctx: null
        },
    }

    this.init = function () {

        graphContainer = document.querySelector('.rel-graph-container')
        graphContainer.style.display = 'grid'
        graphContainer.style.marginBlock = '1em'
        graphContainer.style.border = '#bdbdbd solid 1px'
        canvases.final_render.el = document.createElement('canvas')
        
        window.addEventListener('resize', () => {
            _this.render()
        })

        canvases.final_render.el.addEventListener('mousemove', (event) => {
            _this.render()

            showValuesOverlay(event.offsetX, event.offsetY)
        })
    }

    function sizeCanvases() {
        canvases.final_render.el.width = graphContainer.clientWidth
        canvases.final_render.el.height = graphOptions.graphHeight
        canvases.final_render.ctx = canvases.final_render.el.getContext('2d')

        canvases.layer_verticalSeparators.el = canvases.final_render.el.cloneNode()
        canvases.layer_horizontalSeparators.el = canvases.final_render.el.cloneNode()
        canvases.layer_lines.el = canvases.final_render.el.cloneNode()

        canvases.layer_verticalSeparators.ctx = canvases.layer_verticalSeparators.el.getContext('2d')
        canvases.layer_horizontalSeparators.ctx = canvases.layer_horizontalSeparators.el.getContext('2d')
        canvases.layer_lines.ctx = canvases.layer_lines.el.getContext('2d')

        h = canvases.final_render.el.height - (PADDING * 2)
        w = canvases.final_render.el.width - (PADDING * 2)

        pointWidth = ((w - POINT_RADIUS * 2) / dataPoints)
    }

    this.addDates = function (datesData, options) {
        let defaultOptions = {
            textColor: '#333',
        }

        options = { ...defaultOptions, ...options }

        dates.data = datesData
        dates.options = options
    }

    this.addLines = function (name, values, options)
    {
        let defaultOptions = {
            valueStep: 5,
            inactivelineWidth: 1,
            activeLineWidth: 8,
            textColor: '#333',
            lineColor: 'hsla(0, 100%, 50%, 0.6)',
            headingLocation: 'left',
            valueDivider: 1
        }

        options = { ...defaultOptions, ...options }

        let [minValue, maxValue] = minMax(values)
        minValue *= options.valueDivider
        maxValue *= options.valueDivider
        
        
        if (options.headingLocation === 'left')
        {
            if (!leftVerticalValues.minValue || minValue < leftVerticalValues.minValue) {
                leftVerticalValues.minValue = minValue
            }
            if (!leftVerticalValues.maxValue || maxValue > leftVerticalValues.maxValue) {
                leftVerticalValues.maxValue = maxValue
            }

            const [minFloorVal, maxCeilVal, valDifference] = floorCeilDifference(leftVerticalValues.minValue, leftVerticalValues.maxValue, options.valueStep)
            leftVerticalValues = { ...leftVerticalValues, minFloorVal, maxCeilVal, valDifference}

        }
        if (options.headingLocation === 'right')
        {
            if (!rightVerticalValues.minValue || minValue < rightVerticalValues.minValue) {
                rightVerticalValues.minValue = minValue
            }
            if (!rightVerticalValues.maxValue || maxValue > rightVerticalValues.maxValue) {
                rightVerticalValues.maxValue = maxValue
            }
            
            const [minFloorVal, maxCeilVal, valDifference] = floorCeilDifference(rightVerticalValues.minValue, rightVerticalValues.maxValue, options.valueStep)
            rightVerticalValues = { ...rightVerticalValues, minFloorVal, maxCeilVal, valDifference}
        }

        graphs.push({
            name,
            options,
            values,
        })

        dataPoints = (values.length - 1)
        pointWidth = (w / dataPoints)
    }

    this.render = function () {
        sizeCanvases()
        clearGraph()
        for (const graph of graphs) {
            drawDataLines(graph)
        }
        drawHorizontalSeparators()
        drawVerticalSeparators()
        renderFinal()
    }

    this.clearData = function () {
        graphs = []
        dates.data = []
    }

    this.createGraphChooser = function ()
    {
        graphContainer.insertAdjacentHTML('beforebegin', `
        <fieldset class="rel-graph-chooser" style="display: grid; gap:1em; grid-template-columns: 1fr 1fr; place-items: center; padding:1em; margin-block:1em; border:#bdbdbd solid 1px;">
            <legend style="padding-inline:.25em; margin:0 auto; font-size:1.25em;">
                Choose data to show :
            </legend>
            ${graphInputs()}
        </fieldset>
        `)

        function graphInputs(){
            const left_cont = document.createElement('div')
            left_cont.style.display = 'grid'
            left_cont.style.gap = '.25em'
            const right_cont = left_cont.cloneNode()

            graphs.forEach((graph, index) => {
                const template = `
                    <div>
                        <input type="checkbox" name="device_name" id="${index}" style="transform : scale(2); margin-right:1em;">
                        <label for="device_name" style="color:${graph.options.lineColor}">${graph.name} ${graph.values[graph.values.length-1]}</label>
                    </div>
                `
                if (graph.options.headingLocation === 'left') {
                    left_cont.insertAdjacentHTML('beforeend', template)
                } else {
                    right_cont.insertAdjacentHTML('beforeend', template)
                }
            })
            return left_cont.outerHTML + right_cont.outerHTML
        }


        document.querySelectorAll('.rel-graph-chooser input').forEach(input => {
            input.onchange = setGraphActive
        })

        function setGraphActive(e){
            const id = e.target.id
            const checked = e.target.checked

            if (checked) {
                graphs[id].active = true
            }
            if(!checked) {
                delete graphs[id].active
            }

            _this.render()

        }
    }

    function clearGraph() {
        canvases.final_render.ctx.clearRect(0, 0, graphContainer.clientWidth, graphOptions.graphHeight)
        canvases.final_render.ctx.beginPath()
        canvases.final_render.ctx.rect(0, 0, graphContainer.clientWidth, graphOptions.graphHeight)
        canvases.final_render.ctx.fillStyle = graphOptions.backgroundColor
        canvases.final_render.ctx.fill()
    }

    function drawDataLines (graph) {
        const { values, options } = graph
        const { maxCeilVal, valDifference } = (options.headingLocation === 'left') ? leftVerticalValues : rightVerticalValues
        const ctx = canvases.layer_lines.ctx
        ctx.strokeStyle = options.lineColor
        ctx.lineWidth = graph.active ? options.activeLineWidth : options.inactivelineWidth

        let firstIndex = values.findIndex(value => value !== null)

        if (firstIndex === -1) return

        let isDrawing = false
        
        for (let i = firstIndex; i < values.length; i++)
        {
            let currentVal = values[i]
            if (currentVal === null) continue
            
            currentVal *= graph.options.valueDivider
            const currentY = h / valDifference * (maxCeilVal - currentVal) + PADDING
            const relativeX = PADDING + POINT_RADIUS + (pointWidth * i) 

            if (!isDrawing) {
                isDrawing = true
                ctx.beginPath()
                ctx.moveTo(relativeX-POINT_RADIUS, currentY)
                ctx.lineTo(relativeX+POINT_RADIUS, currentY)
            }

            const nextVal = values[i+1]

            if (isDrawing) {
                ctx.lineTo(relativeX, currentY)
                if (nextVal !== null) ctx.lineTo(relativeX+SMALL_POINT_RADIUS, currentY)
            }

            if ((i < values.length-1 && nextVal === null) || (i === values.length-1 && isDrawing)) {
                isDrawing = false
                ctx.stroke()
            }
        }
        
    }

    function drawHorizontalSeparators () {

        const ctx = canvases.layer_horizontalSeparators.ctx
        ctx.font = graphOptions.font
        ctx.strokeStyle = graphOptions.separatorLineColor
        ctx.lineWidth = graphOptions.separatorLineWidth
        const textPadding = 20
        let headingY = (PADDING - textPadding)
        
        if (leftVerticalValues) {
            const { minFloorVal, maxCeilVal, valDifference } = leftVerticalValues
            ctx.fillStyle = graphOptions.leftHeadingColor
            const valueStep = graphOptions.leftValueStep

            drawHeading(graphOptions.leftHeadingText, PADDING)
            drawHorLines(minFloorVal, maxCeilVal, valDifference, valueStep)
        }

        if (rightVerticalValues) {
            const { minFloorVal, maxCeilVal, valDifference } = rightVerticalValues
            ctx.fillStyle = graphOptions.rightHeadingColor
            const headingX = (w + PADDING - ctx.measureText(graphOptions.rightHeadingText).width)
            const valueX = (PADDING + w + textPadding)
            const valueStep = graphOptions.rightValueStep

            drawHeading(graphOptions.rightHeadingText, headingX)
            drawHorLines(minFloorVal, maxCeilVal, valDifference, valueStep, valueX)

        }

        function drawHeading(text, headingX) {
            ctx.fillText(text, headingX, headingY)
        }

        function drawHorLines(minFloorVal, maxCeilVal, valDifference, valueStep, valueX) {
            if (valDifference <= 10) {
                valueStep = 1
            }
            for (let value = minFloorVal; value <= maxCeilVal; value += valueStep) {
                let y = h / valDifference * (maxCeilVal - value)
                ctx.beginPath()
                ctx.moveTo(PADDING, (y+PADDING))
                ctx.lineTo((w+PADDING), (y+PADDING))
                ctx.stroke()
                let valueY = (y + PADDING + 4)
    
                if (value == minFloorVal)
                    valueY = (y + PADDING)
                if (value == maxCeilVal)
                    valueY = (y + PADDING + 8)
    
                if(!valueX)
                    valueX = (0 + PADDING - ctx.measureText(value).width - textPadding)

                ctx.fillText(value, valueX, valueY)
            }
        }
    }

    function drawVerticalSeparators()
    {
        const ctx = canvases.layer_verticalSeparators.ctx
        ctx.font = graphOptions.font
        
        ctx.strokeStyle = graphOptions.separatorLineColor
        ctx.lineWidth = graphOptions.separatorLineWidth

        let colourStepCount = 0
        for (let i = 0; i < dates.data.length-1; i++) {
            const X = PADDING + POINT_RADIUS + pointWidth*i

            let date = new Date(dates.data[i])


            /* if (timeField === 'minute') {
                if (date.getMinutes() % 5 == 0) {

                    ctx.fillStyle = colourStepCount % 2 == 0 ? 'rgb(207, 215, 232)' : 'transparent'
                    const fillW = i + 5 >= dates.data.length ? pointWidth*(dates.data.length-i-1) : pointWidth*5
                    ctx.fillRect(padding+relativeX, padding, fillW, h)
                    colourStepCount++

                    ctx.beginPath()
                    ctx.moveTo(padding+relativeX, padding)
                    ctx.lineTo(padding+relativeX, h+padding)
                    ctx.stroke()

                    date = date.getHours() +':'+ date.getMinutes()
                    let textX = padding+relativeX - ctx.measureText(date).width/2
                    ctx.fillStyle = '#333'
                    ctx.fillText(date, textX, h+padding+30)
                }
            } */

            if (date.getHours() % 3 == 0) {

                ctx.fillStyle = colourStepCount % 2 == 0 ? graphOptions.verticalBackgroundColor : 'transparent'
                const fillW = i + 3 >= dates.data.length ? pointWidth*(dates.data.length-i-1) : pointWidth*3
                ctx.fillRect(X, PADDING, fillW, h)
                colourStepCount++

                ctx.beginPath()
                ctx.moveTo(X, PADDING)
                ctx.lineTo(X, h+PADDING)
                ctx.stroke()

                date = date.getHours() +':00'
                let textX = X - ctx.measureText(date).width/2
                ctx.fillStyle = dates.options.textColor
                ctx.fillText(date, textX, h+PADDING+30)
            }
            
        }
    }

    function showValuesOverlay(x, y)
    {
        
        // return if mousemove is not in the graph area
        if ((x < PADDING) || (x > PADDING + w) || (y < PADDING) || (y > PADDING + h)) {
            return
        }
        
        const activeGraphs = graphs.filter(graph => graph.active)
        if (!activeGraphs.length) return
        
        
        x -= PADDING - pointWidth/2
        y -= PADDING
        
        let dataIndex = parseInt(dataPoints * x / w)
        if (activeGraphs.length === 1 && activeGraphs[0].values[dataIndex] === null) return
        
        const OVERLAY_TXT_PADDING = 10
        const OVERLAY_POINT_RADIUS = 6

        const ctx = canvases.final_render.ctx
        ctx.font = graphOptions.font
        const currentX = dataIndex * pointWidth + PADDING

        // return if datapoint is null
        //if (activeGraphs[2].values[dataIndex] === null)
        //return

        let overlayEntries = [], leftEntries = [], rightEntries = []
        ctx.fillStyle = 'black'

        for (const activeGraph of activeGraphs) {
            if (activeGraph.values[dataIndex] === null)
                continue
            const val = parseFloat(activeGraph.values[dataIndex] * activeGraph.options.valueDivider).toFixed(1)

            const overlayEntry = {
                name: activeGraph.name,
                color: activeGraph.options.lineColor,
                value: val
            }

            if (activeGraph.options.headingLocation === 'left') 
                leftEntries.push(overlayEntry)
            else
                rightEntries.push(overlayEntry)

            const { maxCeilVal, valDifference } = (activeGraph.options.headingLocation === 'left') ? leftVerticalValues : rightVerticalValues
            const currentVal = activeGraph.values[dataIndex] * activeGraph.options.valueDivider
            const currentY = h / valDifference * (maxCeilVal - currentVal) + PADDING
            ctx.fillRect(currentX-OVERLAY_POINT_RADIUS, currentY-OVERLAY_POINT_RADIUS, OVERLAY_POINT_RADIUS*2, OVERLAY_POINT_RADIUS*2)
        }
        overlayEntries.push(...leftEntries, ...rightEntries)
        
        overlayEntries.unshift({
            name: '',
            color: '#333',
            value: new Date(dates.data[dataIndex]).toLocaleString()
        })
        

        
        const maxLengthValueObject = overlayEntries.reduce((previous, current) => {
            const previousLength = previous.name.toString().length + previous.value.toString().length
            const currentLength = current.name.toString().length + current.value.toString().length
            return ( previousLength > currentLength ? previous : current)
        }, {name:'', value:''} )
        
        const maxString = `${maxLengthValueObject.name} : ${maxLengthValueObject.value}`
        const maxStringWidth = ctx.measureText(maxString).width

        const overlay_w = maxStringWidth + OVERLAY_TXT_PADDING * 2
        const overlay_h = (overlayEntries.length) * (graphOptions.fontSize*.9 + OVERLAY_TXT_PADDING) + OVERLAY_TXT_PADDING

        y += overlay_h + 10

        // limit overlay inside to graph area
        if (overlay_w + x > w + PADDING)
            x = graphContainer.clientWidth - PADDING - overlay_w

        if (x < PADDING)
            x = PADDING

        if (y < overlay_h)
            y = PADDING

        if (overlay_h + y > h + PADDING)
            y = graphContainer.clientHeight - PADDING - overlay_h

        

        // draw outline
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.fillRect(x, y, overlay_w, overlay_h)
        ctx.strokeRect(x, y, overlay_w, overlay_h)

        // draw values
        ctx.fillStyle = 'black'


        const overlay_text_x = x + OVERLAY_TXT_PADDING

        overlayEntries.forEach((entry, index) => {
            let overlay_text_y = y + (graphOptions.fontSize/1.5) + OVERLAY_TXT_PADDING + ((index) * (graphOptions.fontSize*.9 + OVERLAY_TXT_PADDING))
            let overlay_text = `${entry.name} : ${entry.value}`
            
            if (index === 0) {
                overlay_text = entry.value
                ctx.font = 'bold ' + graphOptions.font
            }
            else ctx.font = graphOptions.font
            ctx.fillStyle = entry.color
            ctx.fillText(overlay_text, overlay_text_x, overlay_text_y)
        }) 

        



    }

    function minMax (numbersArray) {
        let max = -Infinity, min = +Infinity
        let minMax = []

        for (let number of numbersArray) {
            number = parseFloat(number)
            if (isNaN(number))
                continue
            if (number > max) {
                max = number
                minMax[1] = max
            }
            if (number < min) {
                min = number
                minMax[0] = min
            }
        }

        return minMax
    }

    function floorCeilDifference (min, max, step) {
        const minFloorVal = Math.floor(min / step) * step
        const maxCeilVal = Math.ceil(max / step) * step
        const valDifference = maxCeilVal - minFloorVal
        return [minFloorVal, maxCeilVal, valDifference]
    }

    
    function renderFinal () {
        canvases.final_render.ctx.drawImage(
            canvases.layer_verticalSeparators.el, 0, 0
        )
        canvases.final_render.ctx.drawImage(
            canvases.layer_horizontalSeparators.el, 0, 0
        )
        canvases.final_render.ctx.drawImage(
            canvases.layer_lines.el, 0, 0
        )
        graphContainer.append(
            canvases.final_render.el
        )
        
    }

}