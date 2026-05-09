import nodemailer from "nodemailer";

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER) {
    console.log("No SMTP_USER found in .env, generating Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Ethereal Email test transporter created.");
  } else {
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`Standard Email transporter created via ${process.env.SMTP_SERVICE || "gmail"}.`);
  }

  return transporter;
};

const buildMeetingLink = (appointment, frontendHost) => {
  let meetingLink = "";
  let buttonText = "View Appointment";

  if (appointment.type === "Video Consultation") {
    if (appointment.meetingProvider === "teams" && appointment.meetingLink) {
      meetingLink = appointment.meetingLink;
      buttonText = "Join Microsoft Teams";
    } else {
      meetingLink = `${frontendHost}/video-consultation?id=${appointment.appointmentNo}`;
      buttonText = "Join Video Call";
    }
  } else if (appointment.type === "Chat Consultation") {
    meetingLink = `${frontendHost}/chat-consultation?id=${appointment.appointmentNo}`;
    buttonText = "Join Secure Chat";
  }

  return { meetingLink, buttonText };
};

export const sendApprovalEmails = async (appointment, patient, doctorUser) => {
  try {
    const t = await initTransporter();
    const frontendHost = process.env.FRONTEND_URL || "http://localhost:5173";
    const { meetingLink, buttonText } = buildMeetingLink(appointment, frontendHost);

    const patientMailOptions = {
      from: '"E-Channelling Telemedicine" <no-reply@echanneling.lk>',
      to: patient.email,
      subject: `Telemedicine Appointment Confirmed: ${appointment.appointmentNo}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2>Appointment Confirmed</h2>
          <p>Dear <strong>${patient.name}</strong>,</p>
          <p>Your ${appointment.type.toLowerCase()} has been confirmed. Below are your appointment details:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Appointment Number:</strong> ${appointment.appointmentNo}</li>
            <li style="margin-bottom: 8px;"><strong>Doctor:</strong> ${appointment.doctorId.name}</li>
            <li style="margin-bottom: 8px;"><strong>Hospital:</strong> ${appointment.doctorId.hospital}</li>
            <li style="margin-bottom: 8px;"><strong>Date:</strong> ${appointment.date}</li>
            <li style="margin-bottom: 8px;"><strong>Time:</strong> ${appointment.time}</li>
          </ul>
          ${
            meetingLink
              ? `
            <div style="margin: 30px 0;">
              <p>Click the button below to join your session at the scheduled time:</p>
              <a href="${meetingLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${buttonText}</a>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">Or copy and paste this link:<br/><a href="${meetingLink}">${meetingLink}</a></p>
            </div>
          `
              : ""
          }
          <p>Thank you for using E-Channelling.</p>
        </div>
      `,
    };

    const doctorMailOptions = {
      from: '"E-Channelling Telemedicine" <no-reply@echanneling.lk>',
      to: doctorUser.email,
      subject: `New Telemedicine Session Approved: ${appointment.appointmentNo}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2>Session Approved</h2>
          <p>Dear <strong>${doctorUser.name}</strong>,</p>
          <p>A ${appointment.type.toLowerCase()} has been successfully confirmed. Below are the details:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Appointment Number:</strong> ${appointment.appointmentNo}</li>
            <li style="margin-bottom: 8px;"><strong>Patient:</strong> ${patient.name}</li>
            <li style="margin-bottom: 8px;"><strong>Date:</strong> ${appointment.date}</li>
            <li style="margin-bottom: 8px;"><strong>Time:</strong> ${appointment.time}</li>
          </ul>
          ${
            meetingLink
              ? `
            <div style="margin: 30px 0;">
              <p>Use the link below to join the session:</p>
              <a href="${meetingLink}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${buttonText}</a>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">Or copy and paste this link:<br/><a href="${meetingLink}">${meetingLink}</a></p>
            </div>
          `
              : ""
          }
          <p>E-Channelling System</p>
        </div>
      `,
    };

    const patientInfo = await t.sendMail(patientMailOptions);
    const doctorInfo = await t.sendMail(doctorMailOptions);

    console.log("---------------------------------------");
    console.log("EMAILS SENT SUCCESSFULLY");
    if (!process.env.SMTP_USER) {
      console.log("Patient Preview URL: %s", nodemailer.getTestMessageUrl(patientInfo));
      console.log("Doctor Preview URL:  %s", nodemailer.getTestMessageUrl(doctorInfo));
    }
    console.log("---------------------------------------");
  } catch (error) {
    console.error("Error sending telemedicine approval emails:", error);
  }
};
