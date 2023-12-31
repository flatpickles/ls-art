<script lang="ts">
    import ParamItem from '../ProjectDetailPanel/ParamItem.svelte';
    import { get } from 'svelte/store';
    import { settingsStore } from '$lib/base/Util/AppState';
    import { userSettingsLabels } from '$config/settings';

    import {
        type ParamValueType,
        type AnyParamValueType,
        ParamGuards
    } from '$lib/base/ConfigModels/ParamTypes';
    import type { ParamConfig } from '$lib/base/ConfigModels/ParamConfig';
    import { settingsParamConfigs } from './SettingsParamConfigs';
    import FunctionInput from '../Inputs/FunctionInput.svelte';
    import { content } from '$config/content';

    // Settings value configs are backed by values in the AppStateStore object
    const settingsValueConfigs = Object.keys(userSettingsLabels).map((key) => {
        const config = settingsParamConfigs.find((config) => config.key === key);
        if (!config) throw new Error(`No settings param config found for key ${key}`);
        return config;
    });

    // Reset sketchbook with reset button click
    function resetSketchbook() {
        // Clear localStorage
        localStorage.clear();

        // Clear cookies
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        // Reload the page
        location.reload();
    }

    // Update settings in the backing app state store when a param is updated
    function paramUpdated(event: CustomEvent) {
        const updatedConfig: ParamConfig = event.detail.config;
        if (ParamGuards.isFunctionParamConfig(updatedConfig)) {
            throw new Error("Function params shouldn't be present in the settings panel");
        } else {
            const value = event.detail.value;
            const newState = {
                ...get(settingsStore),
                [updatedConfig.key]: value
            };
            settingsStore.set(newState);
            // todo: cookies warning
        }
    }

    // Get the properly typed initial value for a given param
    function initialValueForParam<T extends ParamConfig>(paramConfig: T): ParamValueType<T> {
        const currentSettings: Record<string, AnyParamValueType> = get(settingsStore);
        return currentSettings[paramConfig.key] as ParamValueType<T>;
    }
</script>

<div class="settings-wrapper">
    <div class="settings-grid">
        {#each settingsValueConfigs as param, i}
            <ParamItem
                config={param}
                value={initialValueForParam(param)}
                even={i % 2 === 1}
                disabled={false}
                on:update={paramUpdated}
            />
        {/each}
    </div>
    <div class="settings-footer">
        <div class="reset-wrapper">
            <FunctionInput
                id="reset-sketchbook"
                name={content.resetButtonLabel}
                buttonText={content.resetButtonLabel}
                on:click={resetSketchbook}
            />
        </div>
        {#if content.cookiesWarning?.length}
            <div class="cookies-warning">
                <p>{@html content.cookiesWarning}</p>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .settings-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: calc($panel-section-spacing / 2) 0;
        row-gap: $panel-section-spacing;

        // Fade out edges
        @if ($param-list-scroll-fade) {
            mask-image: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0),
                rgba(0, 0, 0, 1) calc($panel-section-spacing / 2),
                rgba(0, 0, 0, 1) calc(100% - $panel-section-spacing / 2),
                rgba(0, 0, 0, 0)
            );
        }

        // Scroll with no scrollbar
        overflow-y: scroll;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }

    // Webkit hide scrollbar
    .settings-wrapper::-webkit-scrollbar {
        display: none;
    }

    .settings-grid {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        row-gap: $param-spacing;
        align-items: center;
    }

    .settings-footer {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: $panel-section-spacing;
        margin: 0 $overlay-panel-edge-inset;
        padding-bottom: calc($panel-section-spacing - $panel-section-spacing / 2);
    }

    .cookies-warning {
        font-size: $small-text-size;
        text-align: center;
        opacity: 0.5;
        padding: 0 $overlay-panel-edge-inset; // A lil extra looks nice
    }
</style>
