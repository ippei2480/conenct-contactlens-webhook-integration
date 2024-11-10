import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  GetObjectCommand,
  GetObjectAclCommandInput,
} from "@aws-sdk/client-s3";

export const handler = async (event: any): Promise<any> => {
  console.log("event: ", JSON.stringify(event));
  const webHookURL = process.env.WEBHOOK_URL!;
  const bucketName = process.env.ANALYSIS_BUCKET_NAME!;
  const contactARN = event.detail.contactArn.split("contact/")[1];
  console.log("contactARN: ", contactARN);

  const analysisJSON = await getAnalysisJSONObject(bucketName, contactARN);

  const transcript = getTranscriptFromJSON(analysisJSON);
  console.log(transcript);

  await kickWebHook(webHookURL, transcript);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Success" }),
  };
};

const getAnalysisJSONObject = async (
  bucketName: string,
  contactARN: string
) => {
  const s3Client = new S3Client();
  const date = new Date();
  const liestObjectCommandInput: ListObjectsV2CommandInput = {
    Bucket: bucketName, // required
    Delimiter: "STRING_VALUE",
    Prefix: `Analysis/Voice/${date.getUTCFullYear()}/${
      date.getUTCMonth() + 1
    }/${date.getUTCDate()}`,
  };
  const liestObjectCommand = new ListObjectsV2Command(liestObjectCommandInput);
  const response = await s3Client.send(liestObjectCommand);
  // console.log(response);

  // get analysis json object key
  let analysisJsonKey;
  if (response.Contents && response.Contents.length > 0) {
    for (const c of response.Contents) {
      if (c.Key?.includes(contactARN)) {
        analysisJsonKey = c.Key;
        break;
      }
    }
    console.log(analysisJsonKey);

    const getObjectCommandInput: GetObjectAclCommandInput = {
      Bucket: bucketName,
      Key: analysisJsonKey,
    };
    const getObjectCommand = new GetObjectCommand(getObjectCommandInput);
    const getObjectResponse = await s3Client.send(getObjectCommand);
    const str = await getObjectResponse.Body?.transformToString();
    return JSON.parse(str as string);
  } else {
    throw new Error("No analysis json object found");
  }
};

// Rulesでトリガーを設定しているため中身がない可能性は考慮しない
const getTranscriptFromJSON = (analysisJSON: any) => {
  let transcript = "";
  let isLastSpeakerAgent: boolean | null = null;

  if (analysisJSON.Transcript && analysisJSON.Transcript.length > 0) {
    for (const t of analysisJSON.Transcript) {
      if (isLastSpeakerAgent == null) {
        if (t.ParticipantId == "AGENT") {
          transcript += `Agent: ${t.Content}`;
          isLastSpeakerAgent = true;
        } else if (t.ParticipantId == "CUSTOMER") {
          transcript += `Customer: ${t.Content}`;
          isLastSpeakerAgent = false;
        }
      } else if (isLastSpeakerAgent) {
        if (t.ParticipantId == "AGENT") {
          transcript += ` ${t.Content}`;
        } else if (t.ParticipantId == "CUSTOMER") {
          transcript += `\nCustomer: ${t.Content}`;
          isLastSpeakerAgent = false;
        }
      } else {
        isLastSpeakerAgent = false;
        if (t.ParticipantId == "AGENT") {
          transcript += `\nAgent: ${t.Content}`;
          isLastSpeakerAgent = true;
        } else if (t.ParticipantId == "CUSTOMER") {
          transcript += ` ${t.Content}`;
        }
      }
    }
  }

  return transcript;
};

const kickWebHook = async (webHookURL: string, transcript: string) => {
  const body = {
    text: transcript,
  };
  const response = await fetch(webHookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log(response);
};
