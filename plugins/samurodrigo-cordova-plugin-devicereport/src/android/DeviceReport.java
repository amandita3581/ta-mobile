package com.samurodrigo.cordova.devicereport;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.os.Build;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class DeviceReport extends CordovaPlugin {
	public static final String GET_DEVICE_REPORT="getDeviceReport";

	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		try {
			if (GET_DEVICE_REPORT.equals(action)) {
				JSONObject deviceReport = getDeviceReport();
				callbackContext.success(deviceReport);
				return true;
			}
			callbackContext.error("Metodo nao encontrado: '" + action + "'");
			return false;
		} catch(Exception e) {
			callbackContext.error("Erro ao obter o modelo da cpu. " + e.getMessage());
			return false;
		}
	}
	@SuppressWarnings("deprecation")
	private JSONObject getDeviceReport() throws JSONException {
		JSONObject obj = new JSONObject();
		try {
            obj.put("architecture", System.getProperty("os.arch"));
			obj.put("cpuabi", Build.CPU_ABI);
			obj.put("cpuabi2", Build.CPU_ABI2);
			obj.put("cpuSummary", getCPUSummary());
		}catch(Exception ex){

		}
		return obj;
	}
	
	private String getCPUSummary() throws JSONException{
		StringBuffer sb = new StringBuffer();
		if (new File("/proc/cpuinfo").exists()) try {
			BufferedReader br = new BufferedReader(new FileReader(new File("/proc/cpuinfo")));
			String aLine;
			while ((aLine = br.readLine()) != null) {
				sb.append(aLine + "<br />");
			}
			if (br != null) {
				br.close();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return sb.toString();
	}
}
