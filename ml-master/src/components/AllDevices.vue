<template>

    <sui-segment id="devices">
        <h1>Devices</h1>

        <h2>Linked Devices</h2>
        <sui-segment inverted style="max-height: 350px; overflow-y: scroll">
            <sui-grid class="middle aligned">
                <sui-grid-row inverted relaxed v-for="device in devices" v-bind:key="device.address">
                    <sui-grid-column :width="10">
                        {{ device.address }}
                    </sui-grid-column>
                    <sui-grid-column :width="4">
                        Status:
                        <span v-if="device.working">Computing</span>
                        <span v-else>Idle</span>
                    </sui-grid-column>
                    <sui-grid-column :width="2">
                        <sui-button animated="vertical" color="black" @click="deleteDevice(device.address)"
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

        <h2>Add New Device</h2>
        <sui-form @submit.prevent>
            <sui-form-fields inline>
                <sui-form-field :error="input_status !== 1">
                    <label>Address</label>
                    <input type="text" placeholder="Address" v-model="add_address" :disabled="running" />
                </sui-form-field>

                <sui-button type="submit" animated="vertical" color="black" @click="addDevice"
                    :disabled="!add_new_address || running">
                    <sui-button-content hidden>Add</sui-button-content>
                    <sui-button-content visible>
                        <sui-icon name="plus" />
                    </sui-button-content>
                </sui-button>
            </sui-form-fields>
        </sui-form>
        <sui-message v-if="device_invalid" header="Invalid device" content="Please check the device address."
            class="negative" dismissable @dismiss="device_invalid = false" />
        <sui-message v-if="device_exists" header="Existing device" content="Please check the device address."
            class="negative" dismissable @dismiss="device_exists = false" />

        <h2>Settings</h2>
        <input type="file" ref="settings_file" id="settings-file" accept=".json" style="display: none" />
        <div is="sui-button-group">
            <sui-button animated="vertical" color="black" @click="saveSettings" style="width: 100px;">
                <sui-button-content hidden>Save</sui-button-content>
                <sui-button-content visible>
                    <sui-icon name="download" />
                </sui-button-content>
            </sui-button>
            <sui-button-or />
            <sui-button animated="vertical" color="black" @click="$refs.settings_file.click()" style="width: 100px;"
                :disabled="running">
                <sui-button-content hidden>Load</sui-button-content>
                <sui-button-content visible>
                    <sui-icon name="upload" />
                </sui-button-content>
            </sui-button>
        </div>
    </sui-segment>

</template>

<script>

import { store } from '../store'

import download from "downloadjs";
import $ from "jquery"

const ipv4_regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

export default {
    name: 'AllDevices',

    store,

    mounted: function () {
        $('#settings-file').change(() => {
            let files = $('#settings-file').prop('files')
            if (files.length > 0) {
                const file = files[0]
                if (file.name.includes(".json")) {
                    const reader = new FileReader();
                    reader.onload = (res) => {
                        const json = JSON.parse(res.target.result)

                        store.commit('clear_devices')
                        for (var i = 0; i < json.devices.length; i++) {
                            this.add_address = json.devices[i].address
                            this.addDevice()
                        }
                    }
                    reader.onerror = (err) => console.log(err)
                    reader.readAsText(file)
                }
            }
        })
    },

    data: function () {
        return {
            add_address: null,

            device_invalid: false,
            device_exists: false,
        }
    },

    computed: {
        input_status: function () {
            if (this.add_address == null || this.add_address.length === 0) {
                return 0
            }
            if (ipv4_regex.test(this.add_address)) return 1
            else return -1
        },

        add_new_address: function () {
            return this.input_status === 1
        },

        devices: function () {
            return store.state.devices
        },

        running: function () {
            return store.state.running
        },
    },

    methods: {
        addDevice: async function (e) {
            if (e != undefined) e.preventDefault();

            if (!this.add_new_address || this.running) return

            this.device_invalid = false
            this.device_exists = false

            let address = this.add_address
            if (address == undefined) {
                this.device_invalid = true
                return
            }

            address = address.trim()
            if (this.devices.some(e => e.address === address)) {
                this.device_exists = true
                return
            }

            try {
                const controller = new AbortController()
                setTimeout(() => controller.abort(), 2000)

                await fetch("http://127.0.0.1:8081/proxy-request", {
                    method: "POST",
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: `http://${address}/awp/ML_Cluster/status.html`
                    })
                });

                store.commit('add_device', {
                    address: address,
                    working: false
                })
                this.add_address = null
            } catch (error) {
                console.log(error);

                this.device_invalid = true
                return
            }
        },

        deleteDevice: function (address) {
            store.commit('delete_device', address)
        },

        saveSettings: function () {
            download(JSON.stringify({
                devices: this.devices
            }), "ML Cluster Settings.json", "text/plain")
        },
    },
}
</script>