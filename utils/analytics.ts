export const AnalyticsCategory = {
    NAVIGATION: 'Navigation',
    STRATEGY: 'Strategy',
    LONG_WEEKEND: 'LongWeekend',
    EFFICIENCY: 'Efficiency'
} as const;

export const AnalyticsAction = {
    CHANGE_YEAR: 'change_year',
    EXPAND: 'expand',
    CLICK_SMART_MOVE: 'click_smart_move',
    CLICK_LONG_WEEKEND: 'click_long_weekend',
    CLICK_POTENTIAL_WEEKEND: 'click_potential_weekend',
    HOVER_LONG_WEEKEND: 'hover_long_weekend',
    HOVER_EFFICIENCY_CLASS: 'hover_efficiency_class'
} as const;

interface EventParams {
    category: string;
    action: string;
    label?: string;
    value?: number;
    [key: string]: any;
}

export const trackEvent = ({ category, action, label, value, ...custom }: EventParams) => {
    try {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value,
                ...custom
            });
        }
    } catch (e) {
        console.warn('Analytics tracking failed', e);
    }
};
