/**
 * Service component to manage field dependencies between components
 * This allows sharing dependency information between different fields
 */
import { LightningElement, api } from 'lwc';

export default class FieldDependencyService extends LightningElement {
    static dependencyMap = {};
    static selectedMajorValues = [];
    static filteredMiddleOptions = [];
    static allMiddleOptions = [];
    static subscribers = {};
    static validMiddleValuesSet = new Set();
    static middleClassSelectedValues = [];

    static setDependencyMap(dependencyMap) {
        this.dependencyMap = dependencyMap;
    }

    static getDependencyMap() {
        return this.dependencyMap;
    }

    static setSelectedMajorValues(values) {
        this.selectedMajorValues = values;
        this.updateFilteredMiddleOptions();
        this.resetInvalidMiddleValues();
        this.notifySubscribers('ProductMiddleClassName__c');
    }

    static getSelectedMajorValues() {
        return this.selectedMajorValues;
    }

    static setAllMiddleOptions(options) {
        this.allMiddleOptions = options;
        this.updateFilteredMiddleOptions();
    }

    static getFilteredMiddleOptions() {
        return this.filteredMiddleOptions;
    }

    static updateFilteredMiddleOptions() {
        if (!this.selectedMajorValues || this.selectedMajorValues.length === 0) {
            // 大分類名が選ばれていない場合は、すべての中分類名を表示する
            this.filteredMiddleOptions = [...this.allMiddleOptions];
            return;
        }

        // 連動する中分類名を取得する
        const validMiddleValuesSet = new Set();
        this.selectedMajorValues.forEach(majorValue => {
            const dependentValues = this.dependencyMap[majorValue] || [];
            dependentValues.forEach(value => validMiddleValuesSet.add(value));
        });

        this.validMiddleValuesSet = validMiddleValuesSet;

        // 中分類名をフィルターする
        this.filteredMiddleOptions = this.allMiddleOptions.filter(option => 
            validMiddleValuesSet.has(option.value)
        );
    }

    static subscribe(fieldApiName, callback) {
        if (!this.subscribers[fieldApiName]) {
            this.subscribers[fieldApiName] = [];
        }
        this.subscribers[fieldApiName].push(callback);
    }

    static notifySubscribers(fieldApiName) {
        if (this.subscribers[fieldApiName]) {
            this.subscribers[fieldApiName].forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }
    
    static setMiddleClassSelectedValues(values) {
        this.middleClassSelectedValues = values || [];
    }
    
    static getMiddleClassSelectedValues() {
        return this.middleClassSelectedValues;
    }
    
    static resetInvalidMiddleValues() {
        if (!this.validMiddleValuesSet || !this.middleClassSelectedValues || this.middleClassSelectedValues.length === 0) {
            return false;
        }
        
        // 選択済の値が有効な値になるか確認
        const hasInvalidValues = this.middleClassSelectedValues.some(value => !this.validMiddleValuesSet.has(value));
        
        if (hasInvalidValues) {
            // 無効な値をフィルターする
            this.middleClassSelectedValues = this.middleClassSelectedValues.filter(
                value => this.validMiddleValuesSet.has(value)
            );
            return true;
        }
        
        return false;
    }
}
