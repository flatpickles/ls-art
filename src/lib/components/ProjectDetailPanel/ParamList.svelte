<script lang="ts">
    import type { ProjectTuple } from '$lib/base/ProjectLoading/ProjectLoader';
    import { type ParamConfig, getParamSections } from '$lib/base/ConfigModels/ParamConfig';
    import {
        ParamGuards,
        type ParamValueType,
        type AnyParamValueType
    } from '$lib/base/ConfigModels/ParamTypes';
    import UserFileLoader from '$lib/base/Util/FileParamLoader';

    import ParamItem from './ParamItem.svelte';
    import ParamValueProvider from '$lib/base/ProjectLoading/ParamValueProvider';
    import PresetUtil from '$lib/base/ProjectLoading/PresetUtil';
    import { onDestroy } from 'svelte';

    export let projectTuple: ProjectTuple;
    export let selectedPresetKey: string;
    export let presetEdited = false;

    let wrapperDiv: HTMLDivElement;
    $: [noSectionParams, paramSections] = getParamSections(projectTuple.params);
    const incompleteUpdateKeys = new Set<string>();

    // Apply a preset to the project's parameter values and displayed param UI, from detail panel.
    // "Applying" a preset involves actually updating the project's values, and then updating the
    // displayed values to match. Prior to application, selectedPresetKey may be set to a preset
    // that is not the currently applied preset, e.g. if the user has edited the preset values.
    export function applyPreset(presetKey: string) {
        // Suspend the display sync loop while applying the preset (if it's running)
        const previousLoopSetting = displaySyncLoopEnabled;
        displaySyncLoopEnabled = false;
        if (displaySyncLoopID) cancelAnimationFrame(displaySyncLoopID);

        // Apply the preset, update UI values, clear edited state, and resume the display loop
        PresetUtil.applyPreset(
            projectTuple,
            presetKey,
            (changedKeys: string[], appliedValues: Record<string, AnyParamValueType>) => {
                if (changedKeys.length > 0) dispatchParamsChangedEvent(changedKeys);
                presetEdited = false;
                displayedValues = {
                    ...displayedValues,
                    ...appliedValues
                };
                displaySyncLoopEnabled = previousLoopSetting;
            }
        );
    }

    // Derive initial display values from the project's current values when switched. Employ some
    // Svelte trickery so this is only reactive to projectTuple reassignments, and not property
    // changes within it.
    let displayedValues = getCurrentParamValues(projectTuple);
    function getCurrentParamValues(currentTuple: ProjectTuple) {
        return Object.fromEntries(
            currentTuple.params.map((param) => {
                return [param.key, initialValueForParam(param)];
            })
        ) as { [key: string]: any };
    }
    $: projectSwitched(projectTuple);
    function projectSwitched(newTuple: ProjectTuple) {
        displayedValues = getCurrentParamValues(newTuple);
        presetEdited = !PresetUtil.presetIsApplied(newTuple, selectedPresetKey);
    }

    // On each animation frame, check if any param values have diverged from their displayed values,
    // e.g. if they have been updated within a project. Keep both the UI and stored state in sync.
    $: displaySyncLoopEnabled = projectTuple.config.twoWaySync;
    $: if (displaySyncLoopEnabled) displaySyncLoop();
    let displaySyncLoopID: number | undefined;
    function displaySyncLoop() {
        const currentValues = projectTuple.project as { [key: string]: any };
        for (const param of projectTuple.params) {
            // If the param is currently being updated, displayedValue is allowed to diverge
            if (incompleteUpdateKeys.has(param.key)) continue;

            // If the param is a function, we can't check for divergence
            const currentValue = currentValues[param.key];
            if (typeof currentValue === 'function') {
                continue;
            }

            // Check for divergence; arrays must be checked element-wise and copied
            let updatedValue: AnyParamValueType | undefined;
            if (Array.isArray(currentValue)) {
                const arrayEquality = currentValue.every(
                    (v: number, i: number) => v === displayedValues[param.key][i]
                );
                if (!arrayEquality) {
                    updatedValue = [...currentValue];
                }
            } else if (currentValue !== displayedValues[param.key]) {
                updatedValue = currentValue;
            }

            // If the value has diverged, update displayedValues and the ParamValueProvider
            if (updatedValue !== undefined) {
                displayedValues[param.key] = updatedValue;
                ParamValueProvider.setValue(
                    param,
                    projectTuple.key,
                    displayedValues[param.key] as ParamValueType<typeof param>
                );
                presetEdited = !PresetUtil.presetIsApplied(projectTuple, selectedPresetKey);
            }
        }

        // Continue checking for divergence on each animation frame
        if (displaySyncLoopEnabled) displaySyncLoopID = requestAnimationFrame(displaySyncLoop);
    }

    onDestroy(() => {
        if (displaySyncLoopID) cancelAnimationFrame(displaySyncLoopID);
    });

    // Apply the updated param (or call the associated function)
    async function paramUpdated(event: CustomEvent) {
        const updatedConfig: ParamConfig = event.detail.config;
        const updateComplete: boolean = event.detail.complete;

        // If the param update isn't complete and applyDuringInput isn't set, allow the UI value
        // to diverge from the project's value, and don't trigger an update.
        if (!updatedConfig.applyDuringInput && !updateComplete) {
            incompleteUpdateKeys.add(updatedConfig.key);
            return;
        }
        incompleteUpdateKeys.delete(updatedConfig.key);

        // Get the current value descriptor (including functions)
        const projectObjectValue = Object.getOwnPropertyDescriptor(
            projectTuple.project,
            updatedConfig.key
        )?.value;

        // Update the project's value for this key, or call the named function
        if (ParamGuards.isFunctionParamConfig(updatedConfig)) {
            // If it's a function param, call the associated function
            if (projectObjectValue) {
                await projectObjectValue();
            }
        } else if (ParamGuards.isFileParamConfig(updatedConfig)) {
            // If it's a file param, load the file(s) then call the associated function
            try {
                // Load the file(s)
                const fileList: FileList = event.detail.value;
                const fileLoadResult = await UserFileLoader.loadFileList(fileList, updatedConfig);

                // Call the function with the loaded file(s)
                if (projectObjectValue) {
                    await projectObjectValue(fileLoadResult.result, fileLoadResult.metadata);
                }
            } catch (e) {
                console.error(e);
                alert('Error loading file(s). See console for details.');
            }
        } else {
            // Check if the value has actually changed
            const valueChanged =
                JSON.stringify(projectObjectValue) !== JSON.stringify(event.detail.value);

            // If it's an array, we need to copy it so that we don't mutate the original
            const inputValue = Array.isArray(event.detail.value)
                ? [...event.detail.value]
                : event.detail.value;
            if (valueChanged)
                Object.defineProperty(projectTuple.project, updatedConfig.key, {
                    value: inputValue,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });

            // Update the stored value and the preset edited state, if the update is complete
            if (updateComplete) {
                ParamValueProvider.setValue(
                    updatedConfig,
                    projectTuple.key,
                    inputValue as ParamValueType<typeof updatedConfig>
                );
                presetEdited = !PresetUtil.presetIsApplied(projectTuple, selectedPresetKey);
            }

            // Dispatch an update event so ProjectViewer can call the paramUpdated lifecycle method.
            if (valueChanged) dispatchParamsChangedEvent([updatedConfig.key]);
        }
    }

    // Get the properly typed initial value for a given param
    function initialValueForParam<T extends ParamConfig>(paramConfig: T): ParamValueType<T> {
        const objectValue = Object.getOwnPropertyDescriptor(
            projectTuple.project,
            paramConfig.key
        )?.value;

        // If it's an array, we need to copy it so that we don't mutate the original
        return Array.isArray(objectValue) ? [...objectValue] : objectValue;
    }

    // Dispatch an update event so ProjectViewer can call the paramUpdated lifecycle method.
    // Svelte custom events cannot bubble, so use a native DOM event instead.
    function dispatchParamsChangedEvent(changedKeys: string[]) {
        wrapperDiv.dispatchEvent(
            new CustomEvent('params-changed', { detail: changedKeys, bubbles: true })
        );
    }
</script>

<div class="params-wrapper" bind:this={wrapperDiv}>
    <!-- Put all params with no section at the top -->
    {#if noSectionParams.length > 0}
        <div class="params-grid" data-testid="no-section-params">
            {#each noSectionParams as param, paramIdx}
                <!-- Even/odd is one-indexed -->
                <ParamItem
                    config={param}
                    bind:value={displayedValues[param.key]}
                    even={paramIdx % 2 == 1}
                    on:update={paramUpdated}
                />
            {/each}
        </div>
    {/if}

    <!-- Display a section for each param section -->
    {#each paramSections as paramSection}
        <div class="params-section" data-testid="params-section">
            <div class="params-section-header">
                <div class="params-section-header-line" />
                <div class="params-section-name">{paramSection.name}</div>
                <div class="params-section-header-line" />
            </div>
            <div class="params-grid">
                {#each paramSection.params as param, paramIdx}
                    <!-- Even/odd is one-indexed -->
                    <ParamItem
                        config={param}
                        bind:value={displayedValues[param.key]}
                        even={paramIdx % 2 == 1}
                        on:update={paramUpdated}
                    />
                {/each}
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .params-wrapper {
        flex-grow: 1;
        padding: calc($panel-section-spacing / 2) 0;

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
    .params-wrapper::-webkit-scrollbar {
        display: none;
    }

    .params-section {
        padding-top: $parameter-section-gap;

        // If it's the first child in params-wrapper, no top padding
        .params-wrapper > &:first-child {
            padding-top: 0;
        }
    }

    .params-section-header {
        @include param-section-header;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: $param-inner-spacing;
    }

    .params-section-header-line {
        flex-grow: 1;
        height: 0;
        border-top: $parameter-section-divider;
    }

    .params-grid {
        display: grid;
        grid-template-columns: fit-content($param-label-max-width) 1fr;
        row-gap: $param-spacing;
        align-items: center;
    }
</style>
