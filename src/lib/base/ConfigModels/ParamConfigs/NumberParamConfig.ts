import { type ParamConfig, ParamConfigDefaults, ParamType } from '../ParamConfig';

export enum NumberParamStyle {
    Combo = 'combo',
    Slider = 'slider',
    Field = 'field'
}

export interface NumberParamConfig extends ParamConfig {
    min: number;
    max: number;
    step: number;
    style: NumberParamStyle;
    default: number | undefined;
    options: number[] | Record<string, number> | undefined;
}

export const NumberParamConfigDefaults: NumberParamConfig = {
    ...ParamConfigDefaults,
    type: ParamType.Number,
    min: 0,
    max: 1,
    step: 0.01,
    style: NumberParamStyle.Combo,
    default: undefined,
    options: undefined
} as const;

export function isNumberParamConfig(param: ParamConfig): param is NumberParamConfig {
    return param.type === ParamType.Number;
}
