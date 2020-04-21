
# Integración Watson APIs: Assistant v2 y Visual Recognition con Facebook Messenger

Esta aplicación demuestra una integración de las Watson APIs, conectando Facebook Messenger con Watson Assistant y Visual Recognition. Se desplegará en Cloud Foundry.

Cloud Foundry Public provee un web endpoint, para ser llamado por Facebook Messenger a través de su Webhook. El mensaje es enviado a Watson Assistant para interactuar con un asistente virtual, si el mensaje es una imagen es enviado a Watson Visual Recognition.

Después de terminar este taller usted entenderá como: 

* Usar Watson Assistant
* Usar Watson Visual Recognition
* Crear y Desplegar una aplicación Cloud Foundry 

<p align="center">
  <img width="80%" src="docs/Capturas/0-Architecture.png">
</p>


## Flujo

1. El usuario interactúa con Facebook Messenger.
2. Facebook Messenger envía el payload a través del CF Endpoint.
3. Se evalúa si el usuario tenía una sesión activa.
4. Se envía el mensaje de texto a Watson Assistant.
5. Si es necesario, se envia una imagen adjunta a Watson Visual Recognition.
6. Se envía la respuesta a Facebook Messenger.
7. El usuario obtiene la respuesta para su interacción.

## Componentes Incluidos

* [Watson Visual Recognition](https://www.ibm.com/watson/developercloud/visual-recognition): Visual Recognition usa algoritmos de deep learning para identificar escenas, objetos y rostros en una imagen. Puede crear y entrenar clasificadores customizados para identificar patrones para sus necesidades.
* [Watson Assistant](https://www.ibm.com/watson/developercloud/assistant): Watson Assistant service combina machine learning, natural language understanding e integra herramientas de dialogo para crear flujos conversacionales entre los usuarios y las aplicaciones.
* [Cloud Foundry Public](https://www.ibm.com/co-es/cloud/cloud-foundry) Ejecuta aplicaciones nativas de la nube, para levantarlas fácilmente y escalar potentemente y para gestionar el tráfico. El consumo se mide por horas y cambia dinámicamente según el uso.

## Tecnologías Importantes

* [Watson](https://www.ibm.com/watson/developer/): Watson en IBM Cloud permite integrar herramientas de AI en tu aplicación y guardar, entrenar y manejar tu data en una nube segura.
* [Api REST](https://www.ibm.com/support/knowledgecenter/es/SSMKHH_10.0.0/com.ibm.etools.mft.doc/bi12017_.htm): Cualquier interfaz entre sistemas que use HTTP para obtener datos o generar operaciones sobre esos datos en todos los formatos posibles, como XML y JSON.

## Prerrequisitos

* Tener una cuenta en [IBM Cloud](https://cloud.ibm.com/registration).
* Tener instalado un IDE (Entorno de desarrollo integrado) como [Visual Studio Code](https://code.visualstudio.com/) u otro.

## Paso a Paso

### 1. Clonar o descargar el repo

Clone el repositorio `fb-watson-v2` localmente. Si es en una terminal, ejecute:

```
$ git clone https://github.com/ricardonior29/fb-watson-v2
```

### 2. Crear el servicio Watson Assistant

Cree un servicio de Watson Assistant desde el [catálogo de servicios de IBM Cloud](https://cloud.ibm.com/catalog):

<p align="left">
  <img width="95%" src="docs/Capturas/1-WatsonAssistantServices.png">
</p>

* Copie la **clave de API** y el **URL** del apartado de credenciales y péguelos en el archivo `params.json` en los valores `wa_api_key` y `wa_url`.
* Inicie el servicio dando click en el botón **Iniciar Watson Assistant**.

<p align="left">
  <img width="90%" src="docs/Capturas/2-WACredentials.png">
</p>


* Cree un nuevo asistente asignandole un nombre, puede ser "Seg Car Assistant":

<p align="left">
  <img width="40%" src="docs/Capturas/3-CreateAssistant.png">
</p>

* Cree un nuevo Dialog Skill en el lenguaje preferido o importe el ejemplo en español [segCar_skill.json](docs/segCar_skill.json) 

<p align="left">
  <img width="65%" src="docs/Capturas/4-CreateSkill.png">
</p>
<p align="left">
  <img width="65%" src="docs/Capturas/5-ImportSkill.png">
</p>


> Si quiere crear su propio asistente virtual siga el [Instructivo para crear un Skill](README_WA.md).


* Después de importar y/o desarrollar el asistente, vaya a **Settings**  en la esquina superior derecha del Asistente (No del Dialog Skill):

<p align="left">
  <img width="95%" src="docs/Capturas/6-ViewCred.png">
</p>


* En la sección de **API Details** copie el **Assistand ID** y péguelo en el archivo `params.json` en el valor `wa_assistant_id`:

<p align="left">
  <img width="95%" src="docs/Capturas/7-GetCred.png">
</p>


### 3. Crear el servicio Watson Visual Recognition

Cree un servicio de Watson Visual Recognition desde el [catálogo de servicios de IBM Cloud](https://cloud.ibm.com/catalog).

* Copie la **clave de API** y el **URL** del apartado de credenciales y péguelos en el archivo `params.json` en los valores `vr_api_key` y `vr_url`.
* Click en el botón **Iniciar Watson Studio** en la página principal del servicio.

> Siga las instrucciones detalladas de como entrenar un modelo de clasificación de imágenes en el [Instructivo para Modelo de Clasificación](README_VR.md).

### 4. Configurar Facebook Messenger

* Cree una Página en [Facebook](https://www.facebook.com/) como un Negocio o Marca.
* Use un nombre único y fácil de buscar.
* Si aun no la tiene, cree una cuenta en [Facebook Developers](https://developers.facebook.com/)
* Agregue una aplicación:

<p align="left">
  <img width="35%" src="docs/Capturas/8-CreateApp.png">
</p>


* Agregue a la aplicación el producto **Messenger** haciendo click en Configurar:

<p align="left">
  <img width="85%" src="docs/Capturas/9-Messenger.png">
</p>


* Una vez configurada vaya a la sección **Tokens de acceso** y seleccione **Agregar o eliminar páginas**. Seleccione la página creada anteriormente:

<p align="left">
  <img width="75%" src="docs/Capturas/10-Page.png">
</p>

* Seleccione **Generar Token** y copie el Token de acceso a la página de Facebook. Péguelo en el archivo `params.json` en el valor `fb_page_access_token`
* Finalmente, en el archivo `params.json` en el valor `fb_verification_token` defina una contraseña propia para su aplicación.

### 6. Desplegar a Cloud Foundry

#### 6.1 Instalar la CLI de IBM Cloud


*  Utilice un navegador para acceder al repositorio oficial de GitHub [`ibm-cloud-cli-releases`](https://github.com/IBM-Cloud/ibm-cloud-cli-release/releases/) y **seleccione** el instalador de su sistema operativo para comenzar la descarga. 
    
* Ejecute el instalador:
    -   Para Mac y Windows™, ejecute el instalador.
    -   Para Linux™, extraiga el paquete y ejecute el script `install`.
    
#### 6.2 Iniciar sesión en IBM Cloud

>Para facilitar el inicio de sesión al CLI siga los siguientes pasos. O si desea ver más formas de iniciar sesión en la CLI siga [esta documentación](https://cloud.ibm.com/docs/iam/federated_id?topic=iam-federated_id&locale=es#federated_id)

* Abra una terminal en su sistema operativo o en el IDE que este usando.
* Especifique la opción `--sso` con el comando`ibmcloud login`.
```
$ ibmcloud login --sso
```
* Siga el URL en la solicitud para obtener un código de acceso de un solo uso.
*   Copie y pegue el valor del código de acceso en la CLI como su entrada. (El código no será visible en la terminal).
* La sesión habrá iniciado.
* Para acceder a los servicios de Cloud Foundry especifique una organización y un espacio de Cloud Foundry. Puede ejecutar el siguiente comando para identificar la organización y el espacio de forma interactiva:
```
$ ibmcloud target --cf
```
O si conoce a qué organización y espacio pertenece el servicio, puede utilizar el siguiente comando:
```
$ ibmcloud target -o <value> -s <value>
```
* Ahora instale Cloud Foundry CLI con el siguiente comando:
```
$ ibmcloud cf install
```

#### 6.3 Desplegar 

**IMPORTANTE: Antes de desplegar cambie el nombre de la aplicación en el archivo `manifest.yaml` (raíz del directorio) por un nombre único y compruebe que el archivo `params.json` tenga los parámetros correctos.**

El siguiente método despliega a Cloud Foundry con un comando usando el archivo `manifest.yaml` que especifica el ambiente de despliegue y nombre de la aplicación.

```
$ ibmcloud cf push
```

> Si quieres ver los logs en consola `ibmcloud cf logs app-name --recent`.
>
> Si quieres deshacer el despliegue puedes usar `ibmcloud cf delete app-name`.

Documentación: [Desplegar usando el App Manifest](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html).

### 7. Configurar el Webhook de Facebook Messenger

* Una vez desplegada la aplicación en Cloud Foundry vaya al [Panel de Control de IBM Cloud](https://cloud.ibm.com/), entre a **Apps de Cloud Foundry** y seleccione la aplicación.

<p align="left">
  <img width="80%" src="docs/Capturas/11-CFApps.png">
</p>

* Copie el Endpoint público de la app desplegada en Cloud Foundry:

<p align="left">
  <img width="90%" src="docs/Capturas/12-AppRoute.png">
</p>

* Vuelva a Facebook Developers y en el sitio de la aplicación de Facebook Messenger vaya a la sección **Webhooks**:

<p align="left">
  <img width="85%" src="docs/Capturas/13-Webhooks.png">
</p>

* Haga click en **Agregar URL...**
* En el panel desplegable, pegue la ruta de la aplicación. Modifiquela añadiendo al final `/webhook`

<p align="left">
  <img width="85%" src="docs/Capturas/14-WebhookConfig.png">
</p>

* En el campo **Token de verificación** ingrese la contraseña que definió en el valor de `fb_verification_token` del archivo `params.json`
* Haga click en el botón **Verificar y guardar**. (Facebook Messenger envía una solicitud `GET` al webhook con el token en el parámetro `hub.verify` de la cadena de consulta). 
* Agregue la página de Facebook al Webhook y haga click en el botón **Editar**:

<p align="left">
  <img width="90%" src="docs/Capturas/15-EditWebhook.png">
</p>

* Seleccione los _campos de suscripción_ **messages** y **messaging_postbacks**.
* Guarde el Webhook.

> Siga la documentación de [Facebook Webhooks](https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup?locale=es_LA)

### 8. Prueba del Asistente Virtual
Entre en la página de Facebook y seleccione probar botón de **Enviar mensaje**. Ya se puede iniciar una conversación (desde la cuenta de la persona con la que se creó la página).

> Facebook Developer crea todas las aplicaciones por defecto como una aplicación de pruebas, si desea publicar la aplicación para que cualquier persona pueda chatear con su asistente virtual debe seguir los [procesos de revisión](https://developers.facebook.com/docs/apps/review/).
