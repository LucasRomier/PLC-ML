<template>
    <div>
        <sui-segment id="data">
            <h1>Data</h1>

            <h2>Algorithm</h2>
            <sui-dropdown placeholder="Select" selection
                :options="algorithms.map(e => ({ text: e.text, value: e.value.id }))" v-model="selected_algorithm_key"
                :disabled="running" />
            <sui-segment v-if="selected_algorithm != null && (selected_algorithm.options || []).length > 0">
                <sui-form @submit.prevent>
                    <sui-form-field inline v-for="option in selected_algorithm.options" v-bind:key="option.key"
                        :error="option.value == null || option.value.length == 0"
                        :disabled="selected_algorithm == null || running">
                        <label>{{ option.name }}</label>
                        <input v-model="option.value" :type="option.type" @change="options_changed"
                            @input="options_changed">
                    </sui-form-field>
                </sui-form>
            </sui-segment>

            <h2>Current Data</h2>
            <h4 v-if="selected_algorithm != null">
                Entry format: {{ selected_algorithm.validate_display }}
            </h4>
            <sui-segment inverted style="max-height: 350px; overflow-y: scroll">
                <sui-grid class="middle aligned">
                    <sui-grid-row inverted relaxed v-for="(input, index) in inputs" v-bind:key="index">
                        <sui-grid-column :width="12"
                            style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                            {{ input }}
                        </sui-grid-column>
                        <sui-grid-column :width="2">
                            <p>
                                Length: {{ input.join(";").length }}
                            </p>
                        </sui-grid-column>
                        <sui-grid-column :width="2">
                            <sui-button animated="vertical" color="black" @click="deleteData(index)"
                                :disabled="running">
                                <sui-button-content hidden>Delete</sui-button-content>
                                <sui-button-content visible>
                                    <sui-icon name="trash" />
                                </sui-button-content>
                            </sui-button>
                        </sui-grid-column>
                    </sui-grid-row>
                </sui-grid>
            </sui-segment>

            <h2>Edit Data</h2>
            <sui-message v-if="entry_errors.length > 0" header="" class="warning" dismissable
                @dismiss="entry_errors = []">
                <sui-message-header>Invalid entries</sui-message-header>
                <sui-message-list>
                    <sui-message-item v-for="error in entry_errors" v-bind:key="error">{{ error }}</sui-message-item>
                </sui-message-list>
            </sui-message>
            <input type="file" ref="data_file_add" id="data-file-add" accept=".csv" style="display: none" />
            <input type="file" ref="data_file_replace" id="data-file-replace" accept=".csv" style="display: none" />
            <div is="sui-button-group">
                <sui-button animated="vertical" color="black" @click="$refs.data_file_add.click()" style="width: 100px;"
                    :disabled="selected_algorithm == null || running">
                    <sui-button-content hidden>Append</sui-button-content>
                    <sui-button-content visible>
                        <sui-icon name="plus" />
                    </sui-button-content>
                </sui-button>
                <sui-button-or />
                <sui-button animated="vertical" color="black" @click="$refs.data_file_replace.click()"
                    :disabled="selected_algorithm == null || running" style="width: 100px;">
                    <sui-button-content hidden>Overwrite</sui-button-content>
                    <sui-button-content visible>
                        <sui-icon name="retweet" />
                    </sui-button-content>
                </sui-button>
                <sui-button-or />
                <sui-button animated="vertical" color="red" @click="clearData" style="width: 100px;"
                    :disabled="this.inputs.length <= 0 || running">
                    <sui-button-content hidden>Clear</sui-button-content>
                    <sui-button-content visible>
                        <sui-icon name="trash" />
                    </sui-button-content>
                </sui-button>
            </div>
            <div is="sui-button-group" class="right floated">
                <sui-button animated="vertical" color="black" style="width: 100px;" @click="random_modal = true"
                    :disabled="selected_algorithm == null || running">
                    <sui-button-content hidden>Random</sui-button-content>
                    <sui-button-content visible>
                        <sui-icon name="random" />
                    </sui-button-content>
                </sui-button>
            </div>
        </sui-segment>

        <sui-modal size="mini" v-model="random_modal">
            <sui-modal-header>Random Data</sui-modal-header>
            <sui-modal-description>
                <sui-segment>
                    <sui-form @submit.prevent>
                        <sui-form-field inline :error="random_size == null || random_size == ''">
                            <label>Line Length</label>
                            <input v-model="random_size" type="number">
                        </sui-form-field>
                        <sui-form-field inline :error="random_lines == null || random_lines == ''">
                            <label>Lines</label>
                            <input v-model="random_lines" type="number">
                        </sui-form-field>
                        <sui-form-field inline :error="random_max == null || random_max == ''">
                            <label>Max Value</label>
                            <input v-model="random_max" type="number">
                        </sui-form-field>
                    </sui-form>
                </sui-segment>
            </sui-modal-description>
            <sui-modal-actions>
                <sui-button negative @click="random_modal = false">
                    Cancel
                </sui-button>
                <sui-button positive @click="add_random_data">
                    Add
                </sui-button>
            </sui-modal-actions>
        </sui-modal>
    </div>
</template>

<script>

import { store } from '../store'

import $ from "jquery"
$.csv = require('jquery-csv')

const VALIDATE_COORDINATE_PAIRS = (entries) => {
    let entry_errors = []
    let data = []

    entries.forEach((line, index) => {
        if (!Array.isArray(line)) this.entry_errors.push(`Entry ${index} is not an array`)
        else if (line.length % 2 !== 0) this.entry_errors.push(`Entry ${index} is of odd length`)
        else if (line.some(e => isNaN(e))) this.entry_errors.push(`Entry ${index} contains NaN`)
        else data.push(line.map(e => parseFloat(e)))
    })
    return { data: data, errors: entry_errors }
}

export default {
    name: 'DataInput',

    store,

    mounted: function () {
        $('#data-file-add').change(() => {
            let files = $('#data-file-add').prop('files')
            if (files.length > 0) {
                const file = files[0]
                if (file.name.includes(".csv")) {
                    this.changeData(file, 'append')
                }
            }
        })

        $('#data-file-replace').change(() => {
            let files = $('#data-file-replace').prop('files')
            if (files.length > 0) {
                const file = files[0]
                if (file.name.includes(".csv")) {
                    this.changeData(file, 'replace')
                }
            }
        })
    },

    data: function () {
        return {
            entry_errors: [],

            selected_algorithm_key: null,

            random_modal: false,
            random_size: 1000,
            random_lines: 1,
            random_max: 100,

            algorithms: [
                {
                    text: "KNN",
                    value: {
                        id: "knn",
                        validate_format: VALIDATE_COORDINATE_PAIRS,
                        validate_display: "Array of entries - {x1: _, y1: _, x2: _, y2: _, ...}",
                        convert_options: (options, data) => {
                            data[`"MasterSettings".options[1]`] = options.clusters

                            for (let i = 0; i < options.clusters; i++) {
                                data[`"MasterSettings".options[${i * 2 + 2}]`] = Math.round(Math.random() * (options.maxX - options.minX) + options.minX);
                                data[`"MasterSettings".options[${i * 2 + 3}]`] = Math.round(Math.random() * (options.maxY - options.minY) + options.minY);
                            }

                            return data
                        },
                        convert_output: (output) => {
                            return output.map(e => {
                                return e.split(";").map(e => Number(e).toPrecision())
                            })
                        },
                        options: [
                            {
                                key: "clusters",
                                name: "Number of Clusters",
                                type: "number",
                                value: 1
                            },
                            {
                                key: "minX",
                                name: "Min X",
                                type: "number",
                                value: 0
                            },
                            {
                                key: "maxX",
                                name: "Max X",
                                type: "number",
                                value: 100
                            },
                            {
                                key: "minY",
                                name: "Min Y",
                                type: "number",
                                value: 0
                            },
                            {
                                key: "maxY",
                                name: "Max Y",
                                type: "number",
                                value: 100
                            }
                        ]
                    }
                },
                {
                    text: "Linear Regression",
                    value: {
                        id: "lr",
                        validate_format: VALIDATE_COORDINATE_PAIRS,
                        validate_display: "Array of entries - {x1: _, y1: _, x2: _, y2: _, ...}",
                        convert_options: (options, data) => data,
                        convert_output: (output) => {
                            return output[0].split(";").map(e => Number(e).toPrecision())
                        },
                    }
                },
            ],
        }
    },

    watch: {
        selected_algorithm_key() {
            store.commit('select_algorithm', this.selected_algorithm)

            if (this.selected_algorithm.options == null) {
                store.commit('change_algorithm_options', {})
            } else {
                store.commit('change_algorithm_options', Object.fromEntries(
                    this.selected_algorithm.options.map(e => [e.key, e.value])
                ))
            }
        },
    },

    computed: {
        inputs: function () {
            return store.state.inputs
        },

        running: function () {
            return store.state.running
        },

        selected_algorithm: function () {
            if (this.selected_algorithm_key == null) return null

            return this.algorithms.find(e => this.selected_algorithm_key === e.value.id).value
        }
    },

    methods: {
        deleteData: function (index) {
            store.commit('remove_input_indexed', index)
        },

        clearData: function () {
            store.commit('clear_inputs')
        },

        changeData: function (file, mode) {
            if (this.selected_algorithm == null) return

            if (mode === 'replace') store.commit('clear_inputs')

            const reader = new FileReader();
            reader.onload = (res) => {
                let data = $.csv.toArrays(res.target.result)

                const output = this.selected_algorithm.validate_format(data)
                data = output.data
                this.entry_errors = output.errors

                store.commit('add_inputs', data)
            }
            reader.onerror = (err) => console.log(err)
            reader.readAsText(file)
        },

        options_changed: function () {
            if (this.selected_algorithm == null) return

            let data = {}
            for (let option of this.selected_algorithm.options) {
                if (option.value == null || option.value.length == 0) {
                    data = null
                    break
                }

                data[option.key] = option.value
            }
            store.commit('change_algorithm_options', data)
        },

        add_random_data: function () {
            if (this.random_size == null || this.random_lines == null || this.random_max == null) return
            if (this.random_size == '' || this.random_lines == '' || this.random_max == '') return

            const data = Array(parseInt(this.random_lines)).fill().map(() => {
                return Array(parseInt(this.random_size)).fill().map(() => Math.round(Math.random() * parseInt(this.random_max)))
            })
            store.commit('add_inputs', data)

            this.random_modal = false
        },
    },
}

</script>