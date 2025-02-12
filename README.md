This is a starter template for PM

npm run build
npm run export
https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html#step1-create-bucket-config-as-website


{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::epgram1/*"
        }
    ]
}



 paymentID        | varchar(100)  | NO   | PRI | NULL                |       |
| receivedDate     | datetime      | YES  |     | NULL                |       |
| receivedAmount   | decimal(12,2) | YES  |     | NULL                |       |
| paidBy           | varchar(100)  | YES  |     | NULL                |       |
| notes            | varchar(1024) | YES  |     | NULL                |       |
| created          | datetime      | YES  |     | current_timestamp() |       |
| modified         | datetime      | YES  |     | current_timestamp() |       |
| paymentTypeID    | varchar(100)  | YES  |     | NULL                |       |
| month            | varchar(100)  | YES  |     | NULL                |       |
| paymentProcessor | varchar(100)  | YES  |     | NULL                |       |
| houseID          | varchar(100)  | YES  |     | NULL                |       |
| ownerID          | int



utc -8 zone:
 moment('2025-02-11 21:11:26').utcOffset(-3).format('YYYY-MM-DD HH:mm:ss')
'2025-02-12 02:11:26'
moment('2025-02-11 21:11:26').utc().format('YYYY-MM-DD HH:mm:ss')
'2025-02-12 05:11:26'


translate utc-8 from ui to utc-5 utc
moment('2025-02-11 21:11:26').utcOffset(-3).format('YYYY-MM-DD HH:mm:ss')
'2025-02-12 02:11:26'

utc-5
moment('2025-02-11 21:11:26').utc()
Moment<2025-02-12T02:11:26Z>

from utc string to est string:
moment.utc('2025-02-12 02:11:26').utcOffset(-5)