<template>

    <sui-segment id="output">
        <h1>Output</h1>

        <h2>Control</h2>
        <div is="sui-button-group">
            <sui-button animated="vertical" color="green" @click="start" style="width: 100px;"
                :disabled="selected_algorithm == null || running || inputs.length <= 0 || devices.length <= 0 || algorithm_options == null">
                <sui-button-content hidden>Start</sui-button-content>
                <sui-button-content visible>
                    <sui-icon name="play" />
                </sui-button-content>
            </sui-button>
            <sui-button-or />
            <sui-button animated="vertical" color="red" @click="stop" :disabled="!running || !loaded"
                style="width: 100px;">
                <sui-button-content hidden>Cancel</sui-button-content>
                <sui-button-content visible>
                    <sui-icon name="stop" />
                </sui-button-content>
            </sui-button>
        </div>

        <h2>Processed Data</h2>
        <sui-message v-if="running && total > 0 && completed <= total">
            <sui-message-header>Status</sui-message-header>
            {{ completed }} / {{ total }} inputs computed.
        </sui-message>
        <sui-message v-if="total > 0 && completed >= total" header="Completed" class="positive"
            content="All inputs computed." dismissable @dismiss="total = 0" />
        <sui-segment inverted style="max-height: 350px; overflow-y: scroll">
            <sui-grid class="middle aligned">
                <sui-grid-row inverted relaxed v-for="(output, index) in outputs" v-bind:key="index">
                    <sui-grid-column :width="16"
                        style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                        {{ output }}
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
        </sui-segment>

        <sui-button animated="vertical" color="black" @click="downloadData" style="width: 100px;"
            :disabled="outputs.length <= 0">
            <sui-button-content hidden>Download</sui-button-content>
            <sui-button-content visible>
                <sui-icon name="download" />
            </sui-button-content>
        </sui-button>

        <sui-message v-if="start_time != null && stop_time != null">
            Start: {{ start_time }}
            <br>
            Stop: {{ stop_time }}
            <br>
            Milliseconds: {{ stop_time.getTime() - start_time.getTime() }}
        </sui-message>
    </sui-segment>

</template>

<script>

import { store } from '../store'

import download from "downloadjs";

import $ from "jquery"
$.csv = require('jquery-csv')

export default {
    name: 'ActionOutput',

    store,

    mounted: function () {
        setInterval(async () => {
            if (this.running && this.loaded) {
                for (let device of this.devices) {
                    try {
                        const fetchController = new AbortController()
                        setTimeout(() => fetchController.abort(), 2000)

                        //TODO: Fix reading of variables here, try LR and KNN if working

                        const response = await fetch("http://127.0.0.1:8081/proxy-request", {
                            method: "POST",
                            signal: fetchController.signal,
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                url: `http://${device.address}/awp/ML_Cluster/status.html`
                            })
                        });
                        const data = await response.text()
                        const statusDoc = $.parseHTML(data)
                        if (statusDoc.length >= 13) {
                            //console.log(statusDoc);
                            const status = statusDoc[1].innerHTML

                            if (status == 2) {
                                const postController = new AbortController()
                                setTimeout(() => postController.abort(), 2000)

                                const output = Array
                                    .from(Array(10).keys())
                                    .filter(index => {
                                        return statusDoc[index + 3].innerHTML != null && statusDoc[index + 3].innerHTML.length > 0
                                    })
                                    .map(index => {
                                        return statusDoc[index + 3].innerHTML.replace(/['"]/g, "")
                                    })
                                    .filter(e => {
                                        return e.length > 0
                                    });
                                this.outputs.push(this.selected_algorithm.convert_output(output))

                                // Reset status
                                await fetch("http://127.0.0.1:8081/proxy-form", {
                                    method: "POST",
                                    signal: postController.signal,
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        url: `http://${device.address}/awp/ML_Cluster/enlist.html`,
                                        data: {
                                            '"MasterSettings".input_data_1': "",
                                            '"MasterSettings".input_data_2': "",
                                            '"MasterSettings".input_data_3': "",
                                            '"MasterSettings".input_data_4': "",
                                            '"MasterSettings".input_data_5': "",
                                            '"MasterSettings".input_data_6': "",
                                            '"MasterSettings".input_data_7': "",
                                            '"MasterSettings".input_data_8': "",
                                            '"MasterSettings".input_data_9': "",
                                            '"MasterSettings".input_data_10': "",
                                            '"MasterSettings".input_length': 0,
                                            '"MasterSettings".status': 0
                                        }
                                    })
                                });
                            } else if (status == 0) {
                                if (this.completed < this.total) {
                                    store.commit('pop_inputs')

                                    const line = store.state.popped_input
                                    if (line != null) {
                                        const data = {}
                                        line.join(";").match(/.{1,253}/g).forEach((element, index) => {
                                            data[`"MasterSettings".input_data[${(index + 1)}]`] = element
                                        });

                                        const postDataController = new AbortController()
                                        setTimeout(() => postDataController.abort(), 2000)
                                        await fetch("http://127.0.0.1:8081/proxy-form", {
                                            method: "POST",
                                            signal: postDataController.signal,
                                            headers: {
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                url: `http://${device.address}/awp/ML_Cluster/enlist.html`,
                                                data: data
                                            })
                                        })

                                        const postAmountController = new AbortController()
                                        setTimeout(() => postAmountController.abort(), 2000)
                                        await fetch("http://127.0.0.1:8081/proxy-form", {
                                            method: "POST",
                                            signal: postAmountController.signal,
                                            headers: {
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                url: `http://${device.address}/awp/ML_Cluster/enlist.html`,
                                                data: {
                                                    '"MasterSettings".input_length': line.length
                                                }
                                            })
                                        })
                                    }
                                } else {
                                    this.stop_time = new Date()

                                    store.commit('change_running_status', false)
                                }
                            }
                        }
                    } catch (error) {
                        console.log(error);

                        store.commit('delete_device', device.address)
                    }
                }
            }

        }, 200)
    },

    data: function () {
        return {
            outputs: [
                //Array.from({ length: 400 }, () => Math.floor(Math.random() * 100))
            ],

            loaded: false,
            total: 0,

            start_time: null,
            stop_time: null
        }
    },

    computed: {
        selected_algorithm: function () {
            return store.state.selected_algorithm
        },
        algorithm_options: function () {
            return store.state.algorithm_options
        },

        inputs: function () {
            return store.state.inputs
        },

        running: function () {
            return store.state.running
        },

        devices: function () {
            return store.state.devices
        },

        completed: function () {
            return this.outputs.length
        },
    },

    methods: {
        start: async function () {
            if (this.running || this.selected_algorithm == null || this.inputs.length <= 0 || this.algorithm_options == null) return
            store.commit('change_running_status', true)

            this.start_time = new Date()

            this.loaded = false

            this.total = this.inputs.length + this.completed

            for (let device of this.devices) {
                try {
                    const controller = new AbortController()
                    setTimeout(() => controller.abort(), 2000)

                    let data = {
                        '"MasterSettings".algorithm': this.selected_algorithm.id,
                        '"MasterSettings".status': 0,
                        '"MasterSettings".input_data_1': "",
                        '"MasterSettings".input_data_2': "",
                        '"MasterSettings".input_data_3': "",
                        '"MasterSettings".input_data_4': "",
                        '"MasterSettings".input_data_5': "",
                        '"MasterSettings".input_data_6': "",
                        '"MasterSettings".input_data_7': "",
                        '"MasterSettings".input_data_8': "",
                        '"MasterSettings".input_data_9': "",
                        '"MasterSettings".input_data_10': ""
                    }
                    // Apply options according to each algorithm
                    data = this.selected_algorithm.convert_options(this.algorithm_options, data)

                    await fetch("http://127.0.0.1:8081/proxy-form", {
                        method: "POST",
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            url: `http://${device.address}/awp/ML_Cluster/enlist.html`,
                            data: data
                        })
                    })
                } catch (error) {
                    console.log(error);

                    store.commit('delete_device', device.address)
                }
            }
            this.loaded = true
        },

        stop: function () {
            if (!this.running) return
            store.commit('change_running_status', false)
        },

        downloadData: function () {
            const output = $.csv.fromArrays(this.outputs)
            download(output, "output.csv", "text/plain")
        },
    }
}
</script>