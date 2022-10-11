import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
    state: {
        selected_algorithm: null,
        algorithm_options: null,

        inputs: [
            /*Array.from({ length: 400 }, () => Math.floor(Math.random() * 100)),
            Array.from({ length: 400 }, () => Math.floor(Math.random() * 100)),
            Array.from({ length: 400 }, () => Math.floor(Math.random() * 100))*/
        ],
        popped_input: null,

        devices: [
            /*{
                address: "192.168.0.1",
                working: false
            }*/
        ],

        running: false
    },
    mutations: {
        select_algorithm(state, algorithm) {
            state.inputs = []
            state.algorithm_options = null

            state.selected_algorithm = algorithm
        },
        change_algorithm_options(state, options) {
            state.algorithm_options = options
        },

        clear_inputs(state) {
            state.inputs = []
        },
        remove_input_indexed(state, index) {
            state.inputs.splice(index, 1)
        },
        add_inputs(state, addition) {
            state.inputs = state.inputs.concat(addition)
        },
        pop_inputs(state) {
            state.popped_input = state.inputs.splice(0, 1)[0]
        },

        clear_devices(state) {
            state.devices = []
        },
        add_device(state, device) {
            state.devices.push(device)
        },
        delete_device(state, address) {
            state.devices = state.devices.filter(e => e.address !== address)
        },

        change_running_status(state, running) {
            state.running = running
        }
    }
})