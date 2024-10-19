-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Album` (
	`AlbumId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Title` text(160) NOT NULL,
	`ArtistId` integer NOT NULL,
	FOREIGN KEY (`ArtistId`) REFERENCES `Artist`(`ArtistId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_AlbumArtistId` ON `Album` (`ArtistId`);--> statement-breakpoint
CREATE TABLE `Artist` (
	`ArtistId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Name` text(120)
);
--> statement-breakpoint
CREATE TABLE `Customer` (
	`CustomerId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`FirstName` text(40) NOT NULL,
	`LastName` text(20) NOT NULL,
	`Company` text(80),
	`Address` text(70),
	`City` text(40),
	`State` text(40),
	`Country` text(40),
	`PostalCode` text(10),
	`Phone` text(24),
	`Fax` text(24),
	`Email` text(60) NOT NULL,
	`SupportRepId` integer,
	FOREIGN KEY (`SupportRepId`) REFERENCES `Employee`(`EmployeeId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_CustomerSupportRepId` ON `Customer` (`SupportRepId`);--> statement-breakpoint
CREATE TABLE `Employee` (
	`EmployeeId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`LastName` text(20) NOT NULL,
	`FirstName` text(20) NOT NULL,
	`Title` text(30),
	`ReportsTo` integer,
	`BirthDate` numeric,
	`HireDate` numeric,
	`Address` text(70),
	`City` text(40),
	`State` text(40),
	`Country` text(40),
	`PostalCode` text(10),
	`Phone` text(24),
	`Fax` text(24),
	`Email` text(60),
	FOREIGN KEY (`ReportsTo`) REFERENCES `Employee`(`EmployeeId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_EmployeeReportsTo` ON `Employee` (`ReportsTo`);--> statement-breakpoint
CREATE TABLE `Genre` (
	`GenreId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Name` text(120)
);
--> statement-breakpoint
CREATE TABLE `Invoice` (
	`InvoiceId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`CustomerId` integer NOT NULL,
	`InvoiceDate` numeric NOT NULL,
	`BillingAddress` text(70),
	`BillingCity` text(40),
	`BillingState` text(40),
	`BillingCountry` text(40),
	`BillingPostalCode` text(10),
	`Total` numeric NOT NULL,
	FOREIGN KEY (`CustomerId`) REFERENCES `Customer`(`CustomerId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_InvoiceCustomerId` ON `Invoice` (`CustomerId`);--> statement-breakpoint
CREATE TABLE `InvoiceLine` (
	`InvoiceLineId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`InvoiceId` integer NOT NULL,
	`TrackId` integer NOT NULL,
	`UnitPrice` numeric NOT NULL,
	`Quantity` integer NOT NULL,
	FOREIGN KEY (`TrackId`) REFERENCES `Track`(`TrackId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice`(`InvoiceId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_InvoiceLineTrackId` ON `InvoiceLine` (`TrackId`);--> statement-breakpoint
CREATE INDEX `IFK_InvoiceLineInvoiceId` ON `InvoiceLine` (`InvoiceId`);--> statement-breakpoint
CREATE TABLE `MediaType` (
	`MediaTypeId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Name` text(120)
);
--> statement-breakpoint
CREATE TABLE `Playlist` (
	`PlaylistId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Name` text(120)
);
--> statement-breakpoint
CREATE TABLE `PlaylistTrack` (
	`PlaylistId` integer NOT NULL,
	`TrackId` integer NOT NULL,
	PRIMARY KEY(`PlaylistId`, `TrackId`),
	FOREIGN KEY (`TrackId`) REFERENCES `Track`(`TrackId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`PlaylistId`) REFERENCES `Playlist`(`PlaylistId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_PlaylistTrackTrackId` ON `PlaylistTrack` (`TrackId`);--> statement-breakpoint
CREATE INDEX `IFK_PlaylistTrackPlaylistId` ON `PlaylistTrack` (`PlaylistId`);--> statement-breakpoint
CREATE TABLE `Track` (
	`TrackId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`Name` text(200) NOT NULL,
	`AlbumId` integer,
	`MediaTypeId` integer NOT NULL,
	`GenreId` integer,
	`Composer` text(220),
	`Milliseconds` integer NOT NULL,
	`Bytes` integer,
	`UnitPrice` numeric NOT NULL,
	FOREIGN KEY (`MediaTypeId`) REFERENCES `MediaType`(`MediaTypeId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`GenreId`) REFERENCES `Genre`(`GenreId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`AlbumId`) REFERENCES `Album`(`AlbumId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `IFK_TrackMediaTypeId` ON `Track` (`MediaTypeId`);--> statement-breakpoint
CREATE INDEX `IFK_TrackGenreId` ON `Track` (`GenreId`);--> statement-breakpoint
CREATE INDEX `IFK_TrackAlbumId` ON `Track` (`AlbumId`);
*/