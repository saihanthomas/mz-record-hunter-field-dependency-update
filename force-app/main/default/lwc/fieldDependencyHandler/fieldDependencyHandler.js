import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';

import PRODUCT2_OBJECT from '@salesforce/schema/Product2';

export default class FieldDependencyHandler extends LightningElement {
    @api fieldApiName;
    recordTypeId;
    dependencyMap = {};

    @wire(getObjectInfo, { objectApiName: PRODUCT2_OBJECT })
    objectInfoHandler({ data, error }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            console.error('Error loading object info:', error);
        }
    }

    @wire(getPicklistValuesByRecordType, {
        objectApiName: PRODUCT2_OBJECT,
        recordTypeId: '$recordTypeId'
    })
    picklistValuesHandler({ data, error }) {
        if (data) {
            const majorField = data.picklistFieldValues.ProductMajorClassName__c;
            const middleField = data.picklistFieldValues.ProductMiddleClassName__c;

            if (majorField && middleField && middleField.controllerValues) {
                const controllerIndexMap = middleField.controllerValues;
                const dependencyMap = {};

                majorField.values.forEach((majorValue, index) => {
                    const validForIndex = index;
                    const dependentValues = [];

                    middleField.values.forEach((middleValue) => {
                        if (middleValue.validFor.includes(validForIndex)) {
                            dependentValues.push(middleValue.value);
                        }
                    });

                    dependencyMap[majorValue.value] = dependentValues;
                });

                this.dependencyMap = dependencyMap;
                
                // Dispatch event with the dependency map
                this.dispatchDependencyMap();
            }
        } else if (error) {
            console.error('Error loading picklist values:', error);
        }
    }

    dispatchDependencyMap() {
        const dependencyJson = JSON.stringify(this.dependencyMap, null, 2);
        
        // Dispatch custom event with dependency map
        const dependencyEvent = new CustomEvent('dependencymapready', {
            detail: {
                dependencyMap: this.dependencyMap,
                dependencyJson: dependencyJson,
                fieldApiName: this.fieldApiName
            }
        });
        this.dispatchEvent(dependencyEvent);
    }
}
