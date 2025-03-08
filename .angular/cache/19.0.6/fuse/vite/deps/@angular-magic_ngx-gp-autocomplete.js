import {
  Loader
} from "./chunk-WSTA6EWN.js";
import {
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  NgModule,
  NgZone,
  Output,
  setClassMetadata,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject
} from "./chunk-27PQTXB7.js";
import "./chunk-4N4GOYJH.js";
import "./chunk-5OPE3T2R.js";
import "./chunk-FHTVLBLO.js";
import {
  __spreadValues
} from "./chunk-EIB7IA3J.js";

// node_modules/@angular-magic/ngx-gp-autocomplete/fesm2022/angular-magic-ngx-gp-autocomplete.mjs
var NgxGpAutocompleteService = class _NgxGpAutocompleteService {
  constructor() {
    this.defaultOptions = {};
  }
  setOptions(options) {
    this.defaultOptions = __spreadValues(__spreadValues({}, this.defaultOptions), options);
  }
  getOptions() {
    return this.defaultOptions;
  }
  enableGooglePersistenceCheck() {
    this.verifyGooglePersistence = true;
  }
  getGooglePersistenceCheck() {
    return this.verifyGooglePersistence;
  }
  static {
    this.ɵfac = function NgxGpAutocompleteService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgxGpAutocompleteService)();
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _NgxGpAutocompleteService,
      factory: _NgxGpAutocompleteService.ɵfac,
      providedIn: "root"
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxGpAutocompleteService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var NgxGpAutocompleteDirective = class _NgxGpAutocompleteDirective {
  constructor(el, ngxGpAutocompleteService, loader, ngZone) {
    this.el = el;
    this.ngxGpAutocompleteService = ngxGpAutocompleteService;
    this.loader = loader;
    this.ngZone = ngZone;
    this.onAddressChange = new EventEmitter();
  }
  ngAfterViewInit() {
    if (!this.options) {
      this.options = this.ngxGpAutocompleteService.getOptions();
    }
    if (this.ngxGpAutocompleteService.getGooglePersistenceCheck()) {
      if (!this.isGoogleLibExists()) {
        this.loader.importLibrary("places").then(() => this.initialize(), console.error);
      }
    } else {
      this.loader.importLibrary("places").then(() => this.initialize(), console.error);
    }
  }
  isGoogleLibExists() {
    return !(!google || !google.maps || !google.maps.places);
  }
  initialize() {
    if (!this.isGoogleLibExists()) throw new Error("Google maps library can not be found");
    this.autocomplete = new google.maps.places.Autocomplete(this.el.nativeElement, this.options);
    if (!this.autocomplete) throw new Error("Autocomplete is not initialized");
    if (!this.autocomplete.addListener != null) {
      this.eventListener = this.autocomplete.addListener("place_changed", () => {
        this.handleChangeEvent();
      });
    }
    this.el.nativeElement.addEventListener("keydown", (event) => {
      if (!event.key) {
        return;
      }
      let key = event.key.toLowerCase();
      if (key == "enter" && event.target === this.el.nativeElement) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
    if (window && window.navigator && window.navigator.userAgent && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      setTimeout(() => {
        let containers = document.getElementsByClassName("pac-container");
        if (containers) {
          let arr = Array.from(containers);
          if (arr) {
            for (let container of arr) {
              if (!container) continue;
              container.addEventListener("touchend", (e) => {
                e.stopImmediatePropagation();
              });
            }
          }
        }
      }, 500);
    }
  }
  reset() {
    this.autocomplete.setComponentRestrictions(this.options.componentRestrictions);
    this.autocomplete.setTypes(this.options.types);
  }
  handleChangeEvent() {
    this.ngZone.run(() => {
      this.place = this.autocomplete.getPlace();
      if (this.place) {
        this.onAddressChange.emit(this.place);
      }
    });
  }
  static {
    this.ɵfac = function NgxGpAutocompleteDirective_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgxGpAutocompleteDirective)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgxGpAutocompleteService), ɵɵdirectiveInject(Loader), ɵɵdirectiveInject(NgZone));
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _NgxGpAutocompleteDirective,
      selectors: [["", "ngx-gp-autocomplete", ""]],
      inputs: {
        options: "options"
      },
      outputs: {
        onAddressChange: "onAddressChange"
      },
      exportAs: ["ngx-places"],
      standalone: false
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxGpAutocompleteDirective, [{
    type: Directive,
    args: [{
      selector: "[ngx-gp-autocomplete]",
      exportAs: "ngx-places"
    }]
  }], function() {
    return [{
      type: ElementRef
    }, {
      type: NgxGpAutocompleteService
    }, {
      type: Loader
    }, {
      type: NgZone
    }];
  }, {
    options: [{
      type: Input
    }],
    onAddressChange: [{
      type: Output
    }]
  });
})();
var NgxGpAutocompleteModule = class _NgxGpAutocompleteModule {
  static {
    this.ɵfac = function NgxGpAutocompleteModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgxGpAutocompleteModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _NgxGpAutocompleteModule,
      declarations: [NgxGpAutocompleteDirective],
      exports: [NgxGpAutocompleteDirective]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({});
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxGpAutocompleteModule, [{
    type: NgModule,
    args: [{
      declarations: [NgxGpAutocompleteDirective],
      exports: [NgxGpAutocompleteDirective]
    }]
  }], null, null);
})();
export {
  NgxGpAutocompleteDirective,
  NgxGpAutocompleteModule,
  NgxGpAutocompleteService
};
//# sourceMappingURL=@angular-magic_ngx-gp-autocomplete.js.map
