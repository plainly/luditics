//Importación de componentes ionic
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,
         LoadingController, ToastController } from 'ionic-angular';

//Importación de modelos y providers.
import { Student } from '../../models/Student';
import { FollowUpProvider } from '../../providers/follow-up/follow-up'
import { FollowUp } from '../../models/FollowUp'

//Importación de componentes nativos
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { Group } from '../../models/Group';

@IonicPage()
@Component({
  selector: 'page-seguimientos',
  templateUrl: 'seguimientos.html',
})
export class SeguimientosPage {
  type: string;
  student: Student;
  behavioralDatas: Array<FollowUp> = [];
  cognitiveDatas: Array<FollowUp> = [];
  followUpData: FollowUp;
  formatDate: string;
  typeCategory = {
    "behavioral": 1,
    "cognitive": 2
  };
  loading: any;
  group : Group;

  /*Se inyectan las dependencias de: 
       *Controlador de vistas
       *Controlador de parametros
       *Provider para obtener los seguimientos de un estudiante desde el back */
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private followUpProvider: FollowUpProvider,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private screenO : ScreenOrientation) {

    //Se deja por defecto el valor de comportamiento para mostrar esta lista en primer lugar.
    this.type = "Comportamiento";
  }

  //Antes de entrar se trae la información del estudiante por parametro y se obtienen sus seguimientos
  ionViewCanEnter() {
    this.student = this.navParams.get("student");
    if (this.student === undefined) {
      return false;
    }
    this.group = this.navParams.get("group");
    //this.screenO.lock('landscape');
    //Se formatea la fecha a  YYYY-MM-DD, para enviarla a la base de datos
    let date = new Date().toLocaleDateString().split("/");
    this.formatDate = date[2] + "-" + date[1] + "-" + date[0];

    this.loading = this.loadingCtrl.create({ content: "Cargando Información..." });
    this.loading.present();

    this.getBehavioralFollowUP(this.student);
    this.getCognitiveFollowUp(this.student);
    return true;
  }

  //Se obtiene el seguimeinto comportamental y ético.
  getBehavioralFollowUP(student: Student) {
    
    /*let date = new Date().toLocaleDateString().split("/");
    this.formatDate = date[2] + "-" + date[1] + "-" + date[0];*/

    this.followUpProvider.getBehavioralFollowUP(this.student.id, this.typeCategory.behavioral,
      this.formatDate).subscribe(data => {
        this.behavioralDatas = data.entity;
        this.behavioralDatas.forEach(element => {
          element.changed = false;
        });
      },
        error => {
        });
  }
  //Se obtiene el seguimeinto cognitivo.
  getCognitiveFollowUp(student: Student) {
    /*let date = new Date().toLocaleDateString().split("/");
    this.formatDate = date[2] + "-" + date[1] + "-" + date[0];*/

    this.followUpProvider.getBehavioralFollowUP(this.student.id, this.typeCategory.cognitive,
      this.formatDate).subscribe(data => {
        this.cognitiveDatas = data.entity;
        this.loading.dismissAll();
        this.cognitiveDatas.forEach(element => {
          element.changed = false;
        });
      }, error => {
        this.loading.dismissAll();
        this.showMessage("Verifique su conexión a internet. No se puede acceder al servidor", true);
        this.navCtrl.pop();
      })
  }

  insertCategoryData() {
    let date = new Date().toLocaleDateString().split("/");
    this.formatDate = date[2] + "-" + date[1] + "-" + date[0];

    this.loading = this.loadingCtrl.create({ content: "Insertando datos a la base de datos..." });
    this.loading.present();
    this.followUpProvider.insertCategoryData(this.group.grupo__id,
      this.formatDate).subscribe(
        data => {
        if (data.status == 201) {
          this.loading.dismissAll();
          this.showMessage("El seguimiento para el día " + date[0] + " - " + date[1] + " - " + date[2] + 
          " se generó correctamente.");

          this.navCtrl.pop();
        }
      },
      error => {
        this.loading.dismissAll();
        this.showMessage("El seguimiento dirario no se puede generar. Verifique su conexión", true);
      });
  }

  /**
   * Se obtiene el dato enviado y se actuliza su valor en la vista 
   * No se envian datos negativos.
   */
  addAccumulator(data) {
    this.followUpData = data;
    this.followUpData.acumulador += 1;
    this.followUpData.changed = true;
  }
  minusAccumulator(data) {
    this.followUpData = data;
    let accumulator = this.followUpData.acumulador - 1;
    if (accumulator >= 0) {
      this.followUpData.acumulador -= 1;
      this.followUpData.changed = true;
    }
  }

  ionViewWillLeave() {
    /**
     * En caso de modificación en los datos de los estudiantes, se procede a enviar los cambios a la bd
     * Solo se insertan los datos que han cambiado.
     * Se envia en el método los parametros de: 
     * Ej updateFollowUp(1,1,2018-10-4,5)
     * En este caso se actualiza al estudiante 1 de la categoria 1, en la fecha 4-oct-2018 con valor de 5
     * El error es para verificar si se perdio conexión a la red.
     */

    if (this.behavioralDatas != undefined) {
      this.behavioralDatas.forEach(element => {
        if (element.changed) {
          this.followUpProvider.updateFollowUP(this.student.id, element.categoria__id,
            this.formatDate, element.acumulador).subscribe(
              data => {
              },
              error => {
                this.showMessage("Verifique su conexión a internet. No se puede actualizar la información comportamental de "
                  + element.categoria__nombre, true);
              });
        }
      });
    }
    if (this.cognitiveDatas != undefined) {
      this.cognitiveDatas.forEach(element => {
        if (element.changed) {
          this.followUpProvider.updateFollowUP(this.student.id, element.categoria__id,
            this.formatDate, element.acumulador).subscribe(
              data => {
              },
              error => {
                this.showMessage("Verifique su conexión a internet. No se puede actualizar la información cognitiva de "
                  + element.categoria__nombre, true);
              });
        }
      });
    }
  }

  //Mostrar mensaje en estilo toast
  showMessage(message: string, showButton: boolean = false) {
    if (showButton == true) {
      let toast = this.toastCtrl.create({
        message: message,
        showCloseButton: showButton,
        closeButtonText: "OK"
      });
      toast.present();
    }
    else {
      let toast = this.toastCtrl.create({
        message: message,
        duration: 3000
      });
      toast.present();
    }
  }
}