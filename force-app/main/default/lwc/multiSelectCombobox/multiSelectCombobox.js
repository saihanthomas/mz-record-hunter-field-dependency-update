import {LightningElement, api, track} from "lwc";
import FieldDependencyService from "c/fieldDependencyService";

export default class MultiSelectCombobox extends LightningElement {
  @api label;
  @api options;
  @api sourceLabel;
  @api selectedLabel;
  @api values = [];
  @api fieldApiName;
  value = "";
  showDialog = false;
  productClassPicklistJson = '';
  @track draftValues = [];
  @track filteredOptions = [];
  originalOptions = [];

  handleDependencyMapReady(event) {
    this.productClassPicklistJson = event.detail.dependencyJson;
    
    // DependencyServiceにDependencyMapを設定する
    if (event.detail.fieldApiName === 'ProductMajorClassName__c') {
      FieldDependencyService.setDependencyMap(event.detail.dependencyMap);
    }
  }

  get comboboxClass() {
    const classList = ["slds-combobox", "slds-dropdown-trigger", "slds-dropdown-trigger_click"];
    if (this.showDialog) {
      classList.push("slds-is-open");
    }
    return classList.join(" ");
  }
  get dialogClass() {
    const classList = ["slds-popover", "slds-popover_full-width"];
    if (!this.showDialog) {
      classList.push("slds-popover_hide");
    }
    return classList.join(" ");
  }
  
  get isMiddleClassField() {
    return this.fieldApiName === 'ProductMiddleClassName__c';
  }
  get buttonClass() {
    const classList = ["slds-input slds-combobox__input  slds-text-align_left"];
    if (this.showDialog) {
      classList.push("slds-has-focus");
    }
    return classList.join(" ");
  }

  onWindowClicked = () => {
    this.value = this.values.join(";");
    this.showDialog = false;
  };
  connectedCallback() {
    window.addEventListener("click", this.onWindowClicked);
    this.value = this.values.join(";");
    this.draftValues = [...this.values];
    
    if (this.options) {
      this.originalOptions = [...this.options];
      this.filteredOptions = [...this.options];
    }
    
    // 中分類名の場合大分類名の値変更をsubscribeする
    if (this.fieldApiName === 'ProductMiddleClassName__c') {
      FieldDependencyService.setAllMiddleOptions(this.originalOptions);
      FieldDependencyService.setMiddleClassSelectedValues(this.values);
      FieldDependencyService.subscribe('ProductMiddleClassName__c', () => {
        this.updateFilteredOptions();
      });
      this.updateFilteredOptions();
    }
  }
  disconnectedCallback() {
    window.removeEventListener("click", this.onWindowClicked);
  }

  onSelectedOptionsChanged(e) {
    this.draftValues = e.detail.value;
    this.value = this.draftValues.join(";");
    
    if (this.fieldApiName === 'ProductMiddleClassName__c') {
      FieldDependencyService.setMiddleClassSelectedValues(this.draftValues);
    }
  }
  
  updateFilteredOptions() {
    if (this.fieldApiName === 'ProductMiddleClassName__c') {
      // fieldDependencyServiceからフィルタされた選択肢を取得する
      this.filteredOptions = FieldDependencyService.getFilteredMiddleOptions();
      
      // フィルタされた選択肢がない場合は元の選択肢を使用する
      if (!this.filteredOptions || this.filteredOptions.length === 0) {
        this.filteredOptions = [...this.originalOptions];
      }

      const updatedValues = FieldDependencyService.getMiddleClassSelectedValues();
      
      if (updatedValues && JSON.stringify(updatedValues) !== JSON.stringify(this.values)) {
        this.values = [...updatedValues];
        this.draftValues = [...updatedValues];
        this.value = this.values.join(";");
      }
    }
  }

  onComboboxClicked(e) {
    e.stopPropagation();
    if (!this.showDialog) {
      this.showDialog = true;
    }
  }
  onDialogClicked(e) {
    e.stopPropagation();
  }
  onCancelClicked(e) {
    e.stopPropagation();
    this.value = this.values.join(";");
    this.showDialog = false;
  }
  onDoneClicked(e) {
    e.stopPropagation();
    this.values = this.draftValues;
    this.showDialog = false;

    if (this.fieldApiName === 'ProductMajorClassName__c') {
      console.log('Picklist JSON:', this.productClassPicklistJson);
      
      // Update the selected major values in the service
      // This will trigger filtering of middle class options and reset invalid values
      FieldDependencyService.setSelectedMajorValues(this.values);
    } else if (this.fieldApiName === 'ProductMiddleClassName__c') {
      // Update the service with the latest selected values
      FieldDependencyService.setMiddleClassSelectedValues(this.values);
    }
    console.log('Field API Name:', this.fieldApiName);
  }
}