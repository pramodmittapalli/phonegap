#include <iostream>

#include <QWebFrame>
#include "webview.h"
#include "debug.h"


using namespace PhoneGap;

WebView::WebView(QWidget* aWidget) : QWebView(aWidget)
{
}


void WebView::initJavascript( )
{
    QWebFrame *frame =  page()->mainFrame();

    std::cout << "initJavaS" << std::endl;

    // Create and bind the commands to javascript
    iDeviceInfo = new DeviceInfo();
    frame->addToJavaScriptWindowObject(s("DeviceInfo"), iDeviceInfo );

    iDebug= new Debug();
    frame->addToJavaScriptWindowObject(s("debug"), iDebug );

    iAccelerometer= new Accelerometer(this);
    frame->addToJavaScriptWindowObject(s("_NativeAccelerometer"), iAccelerometer);

    iNotification = new Notification( );
    frame->addToJavaScriptWindowObject(s("_NativeNotification"), iNotification);
}


void WebView::initPhoneGapAPI()
{
    std::cout << "initPhoneGapAPI" << std::endl;
    initJavascript();
    //connect(this->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(initJavascript() ));
}

WebView::~WebView()
{
    delete iDeviceInfo;
    delete iDebug;
    delete iAccelerometer;
    delete iNotification;
}

