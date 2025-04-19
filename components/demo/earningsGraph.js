
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    LineController,
    BarController,
    PieController,
} from 'chart.js';
import React from 'react';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

function number_format(number, decimals, dec_point, thousands_sep) {
    // *     example: number_format(1234.56, 2, ',', ' ');
    // *     return: '1 234,56'
    number = (number + '').replace(',', '').replace(' ', '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

// all from react-char-js, can't get to install so copied
function reforwardRef(ref, value) {
    if (typeof ref === "function") {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
}
function setOptions(chart, nextOptions) {
    const options = chart.options;
    if (options && nextOptions) {
        Object.assign(options, nextOptions);
    }
}
function setLabels(currentData, nextLabels) {
    currentData.labels = nextLabels;
}
const defaultDatasetIdKey = "label";
function setDatasets(currentData, nextDatasets) {
    let datasetIdKey = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : defaultDatasetIdKey;
    const addedDatasets = [];
    currentData.datasets = nextDatasets.map((nextDataset) => {
        // given the new set, find it's current match
        const currentDataset = currentData.datasets.find((dataset) => dataset[datasetIdKey] === nextDataset[datasetIdKey]);
        // There is no original to update, so simply add new one
        if (!currentDataset || !nextDataset.data || addedDatasets.includes(currentDataset)) {
            return {
                ...nextDataset
            };
        }
        addedDatasets.push(currentDataset);
        Object.assign(currentDataset, nextDataset);
        return currentDataset;
    });
}
function cloneData(data) {
    let datasetIdKey = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultDatasetIdKey;
    const nextData = {
        labels: [],
        datasets: []
    };
    setLabels(nextData, data.labels);
    setDatasets(nextData, data.datasets, datasetIdKey);
    return nextData;
}
function ChartComponent(props, ref) {
    const { height = 150, width = 300, redraw = false, datasetIdKey, type, data, options, plugins = [], fallbackContent, updateMode, ...canvasProps } = props;
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef();
    const renderChart = () => {
        if (!canvasRef.current) return;
        chartRef.current = new ChartJS(canvasRef.current, {
            type,
            data: cloneData(data, datasetIdKey),
            options: options && {
                ...options
            },
            plugins
        });
        reforwardRef(ref, chartRef.current);
    };
    const destroyChart = () => {
        reforwardRef(ref, null);
        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }
    };
    React.useEffect(() => {
        if (!redraw && chartRef.current && options) {
            setOptions(chartRef.current, options);
        }
    }, [
        redraw,
        options
    ]);
    React.useEffect(() => {
        if (!redraw && chartRef.current) {
            setLabels(chartRef.current.config.data, data.labels);
        }
    }, [
        redraw,
        data.labels
    ]);
    React.useEffect(() => {
        if (!redraw && chartRef.current && data.datasets) {
            setDatasets(chartRef.current.config.data, data.datasets, datasetIdKey);
        }
    }, [
        redraw,
        data.datasets
    ]);
    React.useEffect(() => {
        if (!chartRef.current) return;
        if (redraw) {
            destroyChart();
            setTimeout(renderChart);
        } else {
            chartRef.current.update(updateMode);
        }
    }, [
        redraw,
        options,
        data.labels,
        data.datasets,
        updateMode
    ]);
    React.useEffect(() => {
        if (!chartRef.current) return;
        destroyChart();
        setTimeout(renderChart);
    }, [
        type
    ]);
    React.useEffect(() => {
        renderChart();
        return () => destroyChart();
    }, []);
    return /*#__PURE__*/ React.createElement("canvas", Object.assign({
        ref: canvasRef,
        role: "img",
        height: height,
        width: width
    }, canvasProps), fallbackContent);
}
const Chart = /*#__PURE__*/ React.forwardRef(ChartComponent);

function createTypedChart(type, registerables) {
    ChartJS.register(registerables);
    return /*#__PURE__*/ React.forwardRef((props, ref) =>/*#__PURE__*/ React.createElement(Chart, Object.assign({}, props, {
        ref: ref,
        type: type
    })));
}
const Line = /* #__PURE__ */ createTypedChart("line", LineController);
const Bar = /* #__PURE__ */ createTypedChart("bar", BarController);
const Pie = /* #__PURE__ */ createTypedChart("pie", PieController);

export function EarningsGraph() {
    const defData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [{
            label: "Earnings",
            lineTension: 0.3,
            backgroundColor: "rgba(78, 115, 223, 0.05)",
            borderColor: "rgba(78, 115, 223, 1)",
            pointRadius: 3,
            pointBackgroundColor: "rgba(78, 115, 223, 1)",
            pointBorderColor: "rgba(78, 115, 223, 1)",
            pointHoverRadius: 3,
            pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
            pointHoverBorderColor: "rgba(78, 115, 223, 1)",
            pointHitRadius: 10,
            pointBorderWidth: 2,
            data: [0, 10000, 5000, 15000, 10000, 20000, 15000, 25000, 20000, 30000, 25000, 40000],
        }],
    };
    const options = {
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 10,
                right: 25,
                top: 25,
                bottom: 0
            }
        },
        legend: {
            display: false
        },
        tooltips: {
            backgroundColor: "rgb(255,255,255)",
            bodyFontColor: "#858796",
            titleMarginBottom: 10,
            titleFontColor: '#6e707e',
            titleFontSize: 14,
            borderColor: '#dddfeb',
            borderWidth: 1,
            xPadding: 15,
            yPadding: 15,
            displayColors: false,
            intersect: false,
            mode: 'index',
            caretPadding: 10,
            callbacks: {
                label: function (tooltipItem, chart) {
                    var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
                    return datasetLabel + ': $' + number_format(tooltipItem.yLabel);
                }
            }
        }
    };
    
    return <Line data={defData} options={options}></Line>
}

export function RevenueSourceGraph() {
    return <Pie data={{
        labels: ["Direct", "Referral", "Social"],
        datasets: [{
            data: [55, 30, 15],
            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
            hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
            hoverBorderColor: "rgba(234, 236, 244, 1)",
        }],
    }} options={{
        maintainAspectRatio: false,
        tooltips: {
            backgroundColor: "rgb(255,255,255)",
            bodyFontColor: "#858796",
            borderColor: '#dddfeb',
            borderWidth: 1,
            xPadding: 15,
            yPadding: 15,
            displayColors: false,
            caretPadding: 10,
        },
        legend: {
            display: false
        },
        cutoutPercentage: 80,
    }}></Pie>
}