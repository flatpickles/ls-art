<script lang="ts">
    import { isNumericArray } from '$lib/base/ConfigModels/ParamConfigs/NumericArrayParamConfig';
    import ColorConversions from '$lib/base/Util/ColorConversions';
    import { createEventDispatcher } from 'svelte';

    export let id: string;
    export let name: string;
    export let value: string | number[];
    export let disabled = false;
    export let unitColorArrays = false;

    const dispatch = createEventDispatcher();

    // Avoid binding to the value directly within the input elements; depending on the type of
    // value, we may need to convert rgb <-> hex. Within this component we're using hex only (i.e.
    // both values below are hex strings)
    $: fieldValue = maybeRgbToHex(value);
    $: colorPickerValue = maybeRgbToHex(value);

    // Convert rgb to hex if necessary, scaling to [0, 1] if using unitColorArrays
    function maybeRgbToHex(maybeRgb: string | number[]): string {
        if (isNumericArray(maybeRgb)) {
            const scaledRGB = unitColorArrays ? maybeRgb.map((v) => Math.round(v * 255)) : maybeRgb;
            return ColorConversions.rgbToHex(scaledRGB);
        } else {
            return maybeRgb;
        }
    }

    // Convert hex to rbg, scaling to [0, 1] if using unitColorArrays
    function hexToScaledRGB(hex: string): number[] {
        const rgb = ColorConversions.hexToRgb(hex);
        const scaledRGB = unitColorArrays ? rgb.map((v) => v / 255) : rgb;
        return scaledRGB;
    }

    // The text input field has received an input/change event
    function fieldInputEvent(event: Event) {
        const target = event.target as HTMLInputElement;

        // Validate color entry, reset to current value if failed
        const hexRegex = /^#[0-9A-F]{6}$/i;
        if (!hexRegex.test(target.value)) {
            if (event.type === 'change') {
                // Set directly here as well; without binding, the input element won't update
                // while a user is editing it
                target.value = maybeRgbToHex(value);
                fieldValue = maybeRgbToHex(value);
            }
            return;
        }

        // All's good, carry on
        colorPickerValue = target.value;
        if (isNumericArray(value)) {
            value = hexToScaledRGB(target.value);
        } else {
            value = target.value;
        }
        dispatch(event.type, event);
    }

    // The color picker input has received an input/change event
    function pickerInputEvent(event: Event) {
        const target = event.target as HTMLInputElement;
        fieldValue = target.value;
        if (isNumericArray(value)) {
            value = hexToScaledRGB(target.value);
        } else {
            value = target.value;
        }
        dispatch(event.type, event);
    }
</script>

<div class="color-input-wrapper">
    <input
        type="text"
        id={`${id}-field`}
        aria-label={`${name} Field`}
        class="color-field"
        autocomplete="off"
        {disabled}
        value={fieldValue}
        on:input={fieldInputEvent}
        on:change={fieldInputEvent}
        data-testid="color-param-field"
    />
    <div class="color-input-divider" />
    <div class="picker-wrapper">
        <input
            type="color"
            id={`${id}-picker`}
            aria-label={`${name} Color Picker`}
            class="color-picker"
            {disabled}
            value={colorPickerValue}
            on:input={pickerInputEvent}
            on:change={pickerInputEvent}
            data-testid="color-param-selector"
        />
    </div>
</div>

<style lang="scss">
    @import './styles/input-color.scss';

    .color-input-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        outline: $param-input-outline;
        border-radius: $param-input-border-radius;
    }

    .color-input-divider {
        flex-shrink: 0;
        height: 100%;
        width: $param-input-outline-size;
        background-color: $param-input-outline-color;
    }

    .color-field {
        @include string-parameter-input;
        outline: none;
        width: 100%;
        border-radius: $param-input-border-radius 0 0 $param-input-border-radius;
    }

    .picker-wrapper {
        height: 100%;
        width: 100%;
        max-width: $param-input-item-min-width;
        border-radius: 0 $param-input-border-radius $param-input-border-radius 0;

        // Firefox hax: color input has a mysterious inner outline, so make it overflow and clip it
        overflow: hidden;
    }

    .color-picker {
        position: relative;
        left: -50%;
        top: -50%;
        height: 200%;
        width: 200%;
        overflow: hidden;
    }

    input:disabled {
        @include parameter-input-disabled;
    }
</style>
