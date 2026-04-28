/**
 * Mock de @ionic/angular para o ambiente Jest.
 * Os componentes Ionic usam Web Components que não existem em jsdom.
 * Retornamos stubs vazios para que TestBed possa instanciar componentes
 * que dependem de IonApp, IonRouterOutlet, etc.
 */
const { Component } = require('@angular/core');

function stubComponent(selector) {
  @Component({ selector, template: '' })
  class StubComponent {}
  return StubComponent;
}

module.exports = {
  IonApp: stubComponent('ion-app'),
  IonRouterOutlet: stubComponent('ion-router-outlet'),
  IonContent: stubComponent('ion-content'),
  IonHeader: stubComponent('ion-header'),
  IonToolbar: stubComponent('ion-toolbar'),
  IonTitle: stubComponent('ion-title'),
  IonButton: stubComponent('ion-button'),
  IonIcon: stubComponent('ion-icon'),
  IonList: stubComponent('ion-list'),
  IonItem: stubComponent('ion-item'),
  IonLabel: stubComponent('ion-label'),
  IonInput: stubComponent('ion-input'),
  IonicModule: { forRoot: () => ({ ngModule: class {}, providers: [] }) },
};
